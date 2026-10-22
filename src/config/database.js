'use strict';

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '../../database');
const DB_PATH = path.join(DB_DIR, 'kazarma.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for performance and data integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    username            TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    student_code        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    full_name           TEXT    NOT NULL,
    email               TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash       TEXT    NOT NULL,
    role                TEXT    NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
    status              TEXT    NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','approved','rejected','suspended')),
    avatar_url          TEXT,
    bio                 TEXT    DEFAULT '',
    reset_token         TEXT,
    reset_token_expires INTEGER,
    last_login          INTEGER,
    created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at          INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS invitation_codes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT    NOT NULL UNIQUE,
    created_by  INTEGER REFERENCES users(id),
    used_by     INTEGER REFERENCES users(id),
    used_at     INTEGER,
    expires_at  INTEGER,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid        TEXT    PRIMARY KEY,
    sess       TEXT    NOT NULL,
    expired    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    code          TEXT    DEFAULT '',
    description   TEXT    DEFAULT '',
    semester      TEXT    NOT NULL,
    academic_year TEXT    NOT NULL,
    is_archived   INTEGER NOT NULL DEFAULT 0,
    created_by    INTEGER REFERENCES users(id),
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS topics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS subject_announcements (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    author_id   INTEGER NOT NULL REFERENCES users(id),
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS materials (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT    DEFAULT '',
    subject_id    INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id      INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    category      TEXT    NOT NULL,
    uploader_id   INTEGER NOT NULL REFERENCES users(id),
    file_path     TEXT    NOT NULL,
    file_name     TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    file_type     TEXT    NOT NULL,
    file_size     INTEGER NOT NULL,
    tags          TEXT    DEFAULT '',
    is_approved   INTEGER NOT NULL DEFAULT 1,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT    DEFAULT '',
    subject_id    INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id      INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    uploader_id   INTEGER NOT NULL REFERENCES users(id),
    file_path     TEXT,
    file_name     TEXT,
    original_name TEXT,
    file_type     TEXT,
    file_size     INTEGER DEFAULT 0,
    deadline      INTEGER,
    tags          TEXT    DEFAULT '',
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS solutions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id    INTEGER NOT NULL REFERENCES users(id),
    title         TEXT    NOT NULL,
    notes         TEXT    DEFAULT '',
    file_path     TEXT    NOT NULL,
    file_name     TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    file_type     TEXT    NOT NULL,
    file_size     INTEGER NOT NULL,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, material_id)
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ── Seed: default admin ────────────────────────────────────────────────────────
const existingAdmin = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
let adminId = existingAdmin ? existingAdmin.id : null;

if (!existingAdmin) {
  const hash = bcrypt.hashSync('Admin@123', 12);
  const insertAdmin = db.prepare(`
    INSERT INTO users (username, student_code, full_name, email, password_hash, role, status)
    VALUES ('admin', 'ADMIN-001', 'System Administrator', 'admin@kazarma.local', ?, 'admin', 'approved')
  `).run(hash);
  adminId = Number(insertAdmin.lastInsertRowid);
  console.log('[DB] Default admin account created (admin / Admin@123).');
}

// ── Seed: initial invitation code ─────────────────────────────────────────────
const existingCode = db.prepare(`SELECT id FROM invitation_codes WHERE code = 'BHOS-CE25-INIT' LIMIT 1`).get();
if (!existingCode) {
  db.prepare(`
    INSERT INTO invitation_codes (code, created_by, is_active)
    VALUES ('BHOS-CE25-INIT', ?, 1)
  `).run(adminId);
  console.log('[DB] Initial invitation code created: BHOS-CE25-INIT');
}

// ── Seed: default settings ────────────────────────────────────────────────────
const defaultSettings = [
  ['max_file_size_mb', '50'],
  ['allowed_file_types', 'pdf,doc,docx,ppt,pptx,xls,xlsx,txt,png,jpg,jpeg,webp,zip'],
  ['allow_zip_uploads', '1'],
  ['content_moderation_enabled', '0']
];

const insertSetting = db.prepare(`INSERT OR IGNORE INTO platform_settings (key, value) VALUES (?, ?)`);
defaultSettings.forEach(([k, v]) => insertSetting.run(k, v));

// ── Seed: default BHOS CE 25 subjects & topics ────────────────────────────────
const subjectCount = db.prepare(`SELECT COUNT(*) as n FROM subjects`).get().n;
if (subjectCount === 0) {
  const insertSubject = db.prepare(`
    INSERT INTO subjects (name, code, description, semester, academic_year, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertTopic = db.prepare(`
    INSERT INTO topics (subject_id, name, description, order_index)
    VALUES (?, ?, ?, ?)
  `);

  const subjectsData = [
    {
      name: 'Operating Systems',
      code: 'CE 301',
      description: 'Process management, concurrency, virtual memory, file systems, and scheduling in modern OS.',
      semester: 'Fall 2024',
      academic_year: '2024-2025',
      topics: [
        'Processes and CPU Scheduling',
        'Synchronization, Mutexes & Semaphores',
        'Virtual Memory & Paging',
        'File Systems & I/O Subsystems'
      ]
    },
    {
      name: 'Database Management Systems',
      code: 'CE 302',
      description: 'Relational data model, SQL optimization, transactions, ACID properties, and indexing.',
      semester: 'Fall 2024',
      academic_year: '2024-2025',
      topics: [
        'Relational Algebra & Normalization',
        'Advanced SQL & Query Optimization',
        'Transaction Processing & Concurrency Control',
        'Storage Structures & B+ Tree Indexing'
      ]
    },
    {
      name: 'Computer Networks',
      code: 'CE 303',
      description: 'OSI and TCP/IP stack, routing protocols, transport layer flow control, and network security.',
      semester: 'Spring 2025',
      academic_year: '2024-2025',
      topics: [
        'Physical & Data Link Layers',
        'IP Addressing & Routing Protocols (OSPF, BGP)',
        'Transport Layer (TCP, UDP, Congestion Control)',
        'Application Protocols & Network Security'
      ]
    },
    {
      name: 'Software Engineering & Architecture',
      code: 'CE 304',
      description: 'Software development lifecycle, design patterns, microservices, CI/CD, and quality assurance.',
      semester: 'Spring 2025',
      academic_year: '2024-2025',
      topics: [
        'Agile Methodologies & Requirements Engineering',
        'Architectural Styles & Design Patterns',
        'Testing, CI/CD & DevOps Practices',
        'System Scalability & Performance Engineering'
      ]
    }
  ];

  for (const s of subjectsData) {
    const res = insertSubject.run(s.name, s.code, s.description, s.semester, s.academic_year, adminId);
    const subId = Number(res.lastInsertRowid);
    s.topics.forEach((top, idx) => {
      insertTopic.run(subId, top, `Core module ${idx + 1} for ${s.name}`, idx + 1);
    });
  }
  console.log('[DB] Seeded initial BHOS CE 25 subjects and topics.');
}

module.exports = db;
