'use strict';

const db = require('../config/database');

const Setting = {
  get(key, defaultValue = null) {
    const row = db.prepare('SELECT value FROM platform_settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  },

  set(key, value) {
    db.prepare(`
      INSERT INTO platform_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, String(value));
  },

  getAll() {
    const rows = db.prepare('SELECT key, value FROM platform_settings').all();
    const result = {};
    rows.forEach(r => result[r.key] = r.value);
    return result;
  }
};

module.exports = Setting;

