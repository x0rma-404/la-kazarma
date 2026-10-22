'use strict';

const db = require('../config/database');

const CATEGORIES = [
  'Lecture Slides',
  'Lecture Notes',
  'Study Guides',
  'Assignments',
  'Reference Documents',
  'Other Academic Materials'
];

const Material = {
  getCategories() {
    return CATEGORIES;
  },

  getFileTypes() {
    const rows = db.prepare(`SELECT DISTINCT file_type FROM materials ORDER BY file_type`).all();
    return rows.map(r => r.file_type);
  },

  buildWhere(filters) {
    let sql = ' WHERE 1=1';
    const params = [];

    if (filters.subjectId) {
      sql += ' AND m.subject_id = ?';
      params.push(filters.subjectId);
    }

    if (filters.topicId) {
      sql += ' AND m.topic_id = ?';
      params.push(filters.topicId);
    }

    if (filters.semester && filters.semester.trim()) {
      sql += ' AND s.semester = ?';
      params.push(filters.semester.trim());
    }

    if (filters.category && filters.category.trim()) {
      sql += ' AND m.category = ?';
      params.push(filters.category.trim());
    }

    if (filters.fileType && filters.fileType.trim()) {
      sql += ' AND m.file_type = ?';
      params.push(filters.fileType.trim().toLowerCase());
    }

    if (filters.uploaderId) {
      sql += ' AND m.uploader_id = ?';
      params.push(filters.uploaderId);
    }

    if (filters.search && filters.search.trim()) {
      sql += ' AND (m.title LIKE ? OR m.description LIKE ? OR m.tags LIKE ? OR s.name LIKE ?)';
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term, term);
    }

    return { sql, params };
  },

  findAll(filters = {}) {
    const { sql: whereSql, params } = this.buildWhere(filters);

    let orderBy = 'm.created_at DESC';
    if (filters.sort === 'oldest') orderBy = 'm.created_at ASC';
    else if (filters.sort === 'title') orderBy = 'm.title ASC';

    let sql = `
      SELECT m.*,
             s.name AS subject_name,
             s.code AS subject_code,
             s.semester AS subject_semester,
             t.name AS topic_name,
             u.full_name AS uploader_name,
             u.username AS uploader_username,
             (SELECT COUNT(*) FROM bookmarks WHERE material_id = m.id) AS bookmarks_count
      FROM materials m
      JOIN subjects s ON m.subject_id = s.id
      LEFT JOIN topics t ON m.topic_id = t.id
      JOIN users u ON m.uploader_id = u.id
      ${whereSql}
      ORDER BY ${orderBy}
    `;

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit, 10)}`;
      if (filters.offset) {
        sql += ` OFFSET ${parseInt(filters.offset, 10)}`;
      }
    }

    return db.prepare(sql).all(...params);
  },

  count(filters = {}) {
    const { sql: whereSql, params } = this.buildWhere(filters);
    const sql = `
      SELECT COUNT(*) AS total
      FROM materials m
      JOIN subjects s ON m.subject_id = s.id
      LEFT JOIN topics t ON m.topic_id = t.id
      JOIN users u ON m.uploader_id = u.id
      ${whereSql}
    `;
    return db.prepare(sql).get(...params).total;
  },

  findById(id, currentUserId = null) {
    const sql = `
      SELECT m.*,
             s.name AS subject_name,
             s.code AS subject_code,
             s.semester AS subject_semester,
             t.name AS topic_name,
             u.full_name AS uploader_name,
             u.username AS uploader_username,
             u.student_code AS uploader_student_code,
             (SELECT COUNT(*) FROM bookmarks WHERE material_id = m.id) AS bookmarks_count
             ${currentUserId ? `, (SELECT COUNT(*) FROM bookmarks WHERE material_id = m.id AND user_id = ${Number(currentUserId)}) AS is_bookmarked` : ''}
      FROM materials m
      JOIN subjects s ON m.subject_id = s.id
      LEFT JOIN topics t ON m.topic_id = t.id
      JOIN users u ON m.uploader_id = u.id
      WHERE m.id = ?
    `;
    return db.prepare(sql).get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO materials (
        title, description, subject_id, topic_id, category,
        uploader_id, file_path, file_name, original_name,
        file_type, file_size, tags, is_approved
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      data.title.trim(),
      (data.description || '').trim(),
      data.subject_id,
      data.topic_id || null,
      data.category,
      data.uploader_id,
      data.file_path,
      data.file_name,
      data.original_name,
      data.file_type.toLowerCase(),
      data.file_size,
      (data.tags || '').trim(),
      data.is_approved !== undefined ? data.is_approved : 1
    );
    return this.findById(Number(res.lastInsertRowid));
  },

  update(id, data) {
    db.prepare(`
      UPDATE materials
      SET title = ?,
          description = ?,
          subject_id = ?,
          topic_id = ?,
          category = ?,
          tags = ?,
          updated_at = unixepoch()
      WHERE id = ?
    `).run(
      data.title.trim(),
      (data.description || '').trim(),
      data.subject_id,
      data.topic_id || null,
      data.category,
      (data.tags || '').trim(),
      id
    );
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM materials WHERE id = ?').run(id);
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) as n FROM materials').get().n;
  },

  countByUploader(userId) {
    return db.prepare('SELECT COUNT(*) as n FROM materials WHERE uploader_id = ?').get(userId).n;
  }
};

module.exports = Material;

