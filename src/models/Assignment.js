'use strict';

const db = require('../config/database');

const Assignment = {
  findAll(filters = {}) {
    let sql = `
      SELECT a.*,
             s.name AS subject_name,
             s.code AS subject_code,
             s.semester AS subject_semester,
             t.name AS topic_name,
             u.full_name AS uploader_name,
             u.username AS uploader_username,
             (SELECT COUNT(*) FROM solutions WHERE assignment_id = a.id) AS solutions_count
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN topics t ON a.topic_id = t.id
      JOIN users u ON a.uploader_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.subjectId) {
      sql += ' AND a.subject_id = ?';
      params.push(filters.subjectId);
    }

    if (filters.topicId) {
      sql += ' AND a.topic_id = ?';
      params.push(filters.topicId);
    }

    if (filters.search && filters.search.trim()) {
      sql += ' AND (a.title LIKE ? OR a.description LIKE ? OR a.tags LIKE ? OR s.name LIKE ?)';
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (filters.status === 'active') {
      sql += ' AND (a.deadline IS NULL OR a.deadline >= unixepoch())';
    } else if (filters.status === 'past') {
      sql += ' AND a.deadline < unixepoch()';
    }

    sql += ' ORDER BY a.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit, 10)}`;
      if (filters.offset) {
        sql += ` OFFSET ${parseInt(filters.offset, 10)}`;
      }
    }

    return db.prepare(sql).all(...params);
  },

  count(filters = {}) {
    let sql = `
      SELECT COUNT(*) AS total
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN topics t ON a.topic_id = t.id
      JOIN users u ON a.uploader_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.subjectId) {
      sql += ' AND a.subject_id = ?';
      params.push(filters.subjectId);
    }

    if (filters.topicId) {
      sql += ' AND a.topic_id = ?';
      params.push(filters.topicId);
    }

    if (filters.search && filters.search.trim()) {
      sql += ' AND (a.title LIKE ? OR a.description LIKE ? OR a.tags LIKE ? OR s.name LIKE ?)';
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (filters.status === 'active') {
      sql += ' AND (a.deadline IS NULL OR a.deadline >= unixepoch())';
    } else if (filters.status === 'past') {
      sql += ' AND a.deadline < unixepoch()';
    }

    return db.prepare(sql).get(...params).total;
  },

  findById(id) {
    const sql = `
      SELECT a.*,
             s.name AS subject_name,
             s.code AS subject_code,
             s.semester AS subject_semester,
             t.name AS topic_name,
             u.full_name AS uploader_name,
             u.username AS uploader_username,
             u.student_code AS uploader_student_code,
             (SELECT COUNT(*) FROM solutions WHERE assignment_id = a.id) AS solutions_count
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN topics t ON a.topic_id = t.id
      JOIN users u ON a.uploader_id = u.id
      WHERE a.id = ?
    `;
    return db.prepare(sql).get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO assignments (
        title, description, subject_id, topic_id, uploader_id,
        file_path, file_name, original_name, file_type, file_size,
        deadline, tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      data.title.trim(),
      (data.description || '').trim(),
      data.subject_id,
      data.topic_id || null,
      data.uploader_id,
      data.file_path || null,
      data.file_name || null,
      data.original_name || null,
      data.file_type ? data.file_type.toLowerCase() : null,
      data.file_size || 0,
      data.deadline || null,
      (data.tags || '').trim()
    );
    return this.findById(Number(res.lastInsertRowid));
  },

  update(id, data) {
    db.prepare(`
      UPDATE assignments
      SET title = ?,
          description = ?,
          subject_id = ?,
          topic_id = ?,
          deadline = ?,
          tags = ?,
          updated_at = unixepoch()
      WHERE id = ?
    `).run(
      data.title.trim(),
      (data.description || '').trim(),
      data.subject_id,
      data.topic_id || null,
      data.deadline || null,
      (data.tags || '').trim(),
      id
    );
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) as n FROM assignments').get().n;
  }
};

module.exports = Assignment;

