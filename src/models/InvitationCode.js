'use strict';

const db = require('../config/database');
const crypto = require('crypto');

const InvitationCode = {
  findByCode(code) {
    return db.prepare('SELECT * FROM invitation_codes WHERE code = ? COLLATE NOCASE').get(code);
  },

  create(code, createdBy, expiresAt) {
    const stmt = db.prepare(`
      INSERT INTO invitation_codes (code, created_by, expires_at, is_active)
      VALUES (?, ?, ?, 1)
    `);
    const result = stmt.run(code, createdBy || null, expiresAt || null);
    return db.prepare('SELECT * FROM invitation_codes WHERE id = ?').get(result.lastInsertRowid);
  },

  markUsed(code, userId) {
    db.prepare(`
      UPDATE invitation_codes
      SET used_by = ?, used_at = unixepoch(), is_active = 0
      WHERE code = ? COLLATE NOCASE
    `).run(userId, code);
  },

  findAll() {
    return db.prepare(`
      SELECT ic.*,
             u1.username AS created_by_username,
             u2.username AS used_by_username
      FROM invitation_codes ic
      LEFT JOIN users u1 ON ic.created_by = u1.id
      LEFT JOIN users u2 ON ic.used_by    = u2.id
      ORDER BY ic.created_at DESC
    `).all();
  },

  deactivate(id) {
    db.prepare('UPDATE invitation_codes SET is_active = 0 WHERE id = ?').run(id);
  },

  /** Generate a secure random code like BHOS-XXXX-XXXX */
  generateCode() {
    const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    return `BHOS-${part()}-${part()}`;
  }
};

module.exports = InvitationCode;
