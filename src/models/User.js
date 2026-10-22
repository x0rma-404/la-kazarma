'use strict';

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const BCRYPT_ROUNDS = 12;

const User = {
  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  },

  findByStudentCode(code) {
    return db.prepare('SELECT * FROM users WHERE student_code = ? COLLATE NOCASE').get(code);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
  },

  /** Used for login – matches username OR student_code */
  findByUsernameOrCode(identifier) {
    return db.prepare(
      'SELECT * FROM users WHERE username = ? COLLATE NOCASE OR student_code = ? COLLATE NOCASE'
    ).get(identifier, identifier);
  },

  /** Create a new user. Password is hashed internally. */
  create(data) {
    const hash = bcrypt.hashSync(data.password, BCRYPT_ROUNDS);
    const stmt = db.prepare(`
      INSERT INTO users (username, student_code, full_name, email, password_hash, role, status)
      VALUES (@username, @student_code, @full_name, @email, @password_hash, @role, @status)
    `);
    const result = stmt.run({
      username: data.username,
      student_code: data.student_code,
      full_name: data.full_name,
      email: data.email,
      password_hash: hash,
      role: data.role || 'student',
      status: data.status || 'pending'
    });
    return this.findById(result.lastInsertRowid);
  },

  /** Update password – hashes before saving */
  updatePassword(id, newPassword) {
    const hash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
    db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?
    `).run(hash, id);
  },

  updateProfile(id, data) {
    db.prepare(`
      UPDATE users
      SET full_name = @full_name,
          email     = @email,
          bio       = @bio,
          updated_at = unixepoch()
      WHERE id = @id
    `).run({ id, full_name: data.full_name, email: data.email, bio: data.bio || '' });
    return this.findById(id);
  },

  updateStatus(id, status) {
    db.prepare(`UPDATE users SET status = ?, updated_at = unixepoch() WHERE id = ?`).run(status, id);
  },

  setResetToken(id, token, expiresAt) {
    db.prepare(`UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = unixepoch() WHERE id = ?`)
      .run(token, expiresAt, id);
  },

  clearResetToken(id) {
    db.prepare(`UPDATE users SET reset_token = NULL, reset_token_expires = NULL, updated_at = unixepoch() WHERE id = ?`)
      .run(id);
  },

  findByResetToken(token) {
    return db.prepare(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > unixepoch()'
    ).get(token);
  },

  findAll() {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  },

  findPending() {
    return db.prepare(`SELECT * FROM users WHERE status = 'pending' ORDER BY created_at DESC`).all();
  },

  recordLogin(id) {
    db.prepare(`UPDATE users SET last_login = unixepoch(), updated_at = unixepoch() WHERE id = ?`).run(id);
  },

  countByStatus(status) {
    return db.prepare('SELECT COUNT(*) as n FROM users WHERE status = ?').get(status).n;
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  }
};

module.exports = User;
