'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const SqliteStore = require('./src/config/sessionStore');
const fs = require('fs');

// Ensure directories exist
['./database', './uploads'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Initialize DB (auto-seeds admin + invitation code)
const db = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ── View engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/favicon.ico', (req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(__dirname, 'public/assets/favicon.svg'));
});

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  store: new SqliteStore(),
  secret: process.env.SESSION_SECRET || 'kazarma-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// ── Flash middleware ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.user = req.session.user || null;
  next();
});

// ── CSRF-lite: check origin/referer on state-changing requests ────────────────
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer || '';
    const host = req.headers.host;
    if (origin && host && !origin.includes(host)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', require('./src/routes/auth'));
app.use('/dashboard', require('./src/routes/dashboard'));
app.use('/subjects', require('./src/routes/subjects'));
app.use('/materials', require('./src/routes/materials'));
app.use('/assignments', require('./src/routes/assignments'));
app.use('/bookmarks', require('./src/routes/bookmarks'));
app.use('/profile', require('./src/routes/profile'));
app.use('/settings', require('./src/routes/settings'));
app.use('/admin', require('./src/routes/admin'));

// Root redirect
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 – Not Found',
    code: 404,
    message: 'The page you are looking for does not exist.'
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).render('error', {
    title: 'Server Error',
    code: err.status || 500,
    message: process.env.NODE_ENV === 'development' ? err.message : 'An internal error occurred.'
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⚔  La Kazarma de BHOS CE 25`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  Admin login: admin / Admin@123`);
  console.log(`  Invite code: BHOS-CE25-INIT\n`);
});

module.exports = app;
