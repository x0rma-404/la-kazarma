'use strict';

const db = require('../config/database');

const Subject = {
  findAll({ includeArchived = false, semester = null, search = null } = {}) {
    let sql = `
      SELECT s.*,
             u.full_name AS creator_name,
             (SELECT COUNT(*) FROM materials WHERE subject_id = s.id) AS materials_count,
             (SELECT COUNT(*) FROM assignments WHERE subject_id = s.id) AS assignments_count,
             (SELECT COUNT(*) FROM topics WHERE subject_id = s.id) AS topics_count
      FROM subjects s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (!includeArchived) {
      sql += ' AND s.is_archived = 0';
    }

    if (semester && semester.trim()) {
      sql += ' AND s.semester = ?';
      params.push(semester.trim());
    }

    if (search && search.trim()) {
      sql += ' AND (s.name LIKE ? OR s.code LIKE ? OR s.description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY s.academic_year DESC, s.semester DESC, s.name ASC';
    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare(`
      SELECT s.*,
             u.full_name AS creator_name,
             (SELECT COUNT(*) FROM materials WHERE subject_id = s.id) AS materials_count,
             (SELECT COUNT(*) FROM assignments WHERE subject_id = s.id) AS assignments_count,
             (SELECT COUNT(*) FROM topics WHERE subject_id = s.id) AS topics_count
      FROM subjects s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `).get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO subjects (name, code, description, semester, academic_year, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      data.name.trim(),
      (data.code || '').trim().toUpperCase(),
      (data.description || '').trim(),
      data.semester.trim(),
      data.academic_year.trim(),
      data.created_by || null
    );
    return this.findById(Number(res.lastInsertRowid));
  },

  update(id, data) {
    db.prepare(`
      UPDATE subjects
      SET name = ?,
          code = ?,
          description = ?,
          semester = ?,
          academic_year = ?,
          updated_at = unixepoch()
      WHERE id = ?
    `).run(
      data.name.trim(),
      (data.code || '').trim().toUpperCase(),
      (data.description || '').trim(),
      data.semester.trim(),
      data.academic_year.trim(),
      id
    );
    return this.findById(id);
  },

  setArchived(id, isArchived) {
    db.prepare(`UPDATE subjects SET is_archived = ?, updated_at = unixepoch() WHERE id = ?`)
      .run(isArchived ? 1 : 0, id);
    return this.findById(id);
  },

  getSemesters() {
    const rows = db.prepare(`SELECT DISTINCT semester FROM subjects WHERE is_archived = 0 ORDER BY semester`).all();
    return rows.map(r => r.semester);
  },

  countAll(includeArchived = false) {
    if (includeArchived) {
      return db.prepare(`SELECT COUNT(*) as n FROM subjects`).get().n;
    }
    return db.prepare(`SELECT COUNT(*) as n FROM subjects WHERE is_archived = 0`).get().n;
  }
};

module.exports = Subject;

