'use strict';

const db = require('../config/database');

const Topic = {
  findBySubjectId(subjectId) {
    return db.prepare(`
      SELECT t.*,
             (SELECT COUNT(*) FROM materials WHERE topic_id = t.id) AS materials_count,
             (SELECT COUNT(*) FROM assignments WHERE topic_id = t.id) AS assignments_count
      FROM topics t
      WHERE t.subject_id = ?
      ORDER BY t.order_index ASC, t.id ASC
    `).all(subjectId);
  },

  findById(id) {
    return db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  },

  create(subjectId, name, description = '', orderIndex = 0) {
    const stmt = db.prepare(`
      INSERT INTO topics (subject_id, name, description, order_index)
      VALUES (?, ?, ?, ?)
    `);
    const res = stmt.run(subjectId, name.trim(), (description || '').trim(), orderIndex || 0);
    return this.findById(Number(res.lastInsertRowid));
  },

  update(id, name, description = '') {
    db.prepare(`
      UPDATE topics
      SET name = ?, description = ?
      WHERE id = ?
    `).run(name.trim(), (description || '').trim(), id);
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM topics WHERE id = ?').run(id);
  }
};

module.exports = Topic;

