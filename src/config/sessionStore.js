'use strict';

const session = require('express-session');
const db = require('./database');

class SqliteStore extends session.Store {
  constructor() {
    super();
    // Periodically clean up expired sessions every 15 minutes
    this.cleanupTimer = setInterval(() => {
      try {
        db.prepare('DELETE FROM sessions WHERE expired < ?').run(Date.now());
      } catch (e) {
        console.error('[SessionStore] Cleanup error:', e.message);
      }
    }, 15 * 60 * 1000);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  get(sid, fn) {
    try {
      const row = db.prepare('SELECT sess, expired FROM sessions WHERE sid = ?').get(sid);
      if (!row) return fn(null, null);
      if (row.expired < Date.now()) {
        this.destroy(sid, () => {});
        return fn(null, null);
      }
      const sess = JSON.parse(row.sess);
      return fn(null, sess);
    } catch (err) {
      return fn(err);
    }
  }

  set(sid, sess, fn) {
    try {
      let maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
      if (sess && sess.cookie && sess.cookie.maxAge) {
        maxAge = sess.cookie.maxAge;
      }
      const expired = Date.now() + maxAge;
      const sessStr = JSON.stringify(sess);
      db.prepare(`
        INSERT INTO sessions (sid, sess, expired)
        VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expired = excluded.expired
      `).run(sid, sessStr, expired);
      if (fn) fn(null);
    } catch (err) {
      if (fn) fn(err);
    }
  }

  destroy(sid, fn) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      if (fn) fn(null);
    } catch (err) {
      if (fn) fn(err);
    }
  }

  touch(sid, sess, fn) {
    try {
      let maxAge = 1000 * 60 * 60 * 24 * 7;
      if (sess && sess.cookie && sess.cookie.maxAge) {
        maxAge = sess.cookie.maxAge;
      }
      const expired = Date.now() + maxAge;
      db.prepare('UPDATE sessions SET expired = ? WHERE sid = ?').run(expired, sid);
      if (fn) fn(null);
    } catch (err) {
      if (fn) fn(err);
    }
  }
}

module.exports = SqliteStore;

