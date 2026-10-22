'use strict';

const db = require('../config/database');

const Bookmark = {
  isBookmarked(userId, materialId) {
    const row = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND material_id = ?').get(userId, materialId);
    return !!row;
  },

  toggle(userId, materialId) {
    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND material_id = ?').get(userId, materialId);
    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      return false; // unbookmarked
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, material_id) VALUES (?, ?)').run(userId, materialId);
      return true; // bookmarked
    }
  },

  findByUser(userId) {
    return db.prepare(`
      SELECT b.id AS bookmark_id,
             b.created_at AS bookmarked_at,
             m.*,
             s.name AS subject_name,
             s.code AS subject_code,
             t.name AS topic_name,
             u.full_name AS uploader_name,
             1 AS is_bookmarked
      FROM bookmarks b
      JOIN materials m ON b.material_id = m.id
      JOIN subjects s ON m.subject_id = s.id
      LEFT JOIN topics t ON m.topic_id = t.id
      JOIN users u ON m.uploader_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);
  },

  countByUser(userId) {
    return db.prepare('SELECT COUNT(*) as n FROM bookmarks WHERE user_id = ?').get(userId).n;
  }
};

module.exports = Bookmark;

