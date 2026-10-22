'use strict';

const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const db = require('../config/database');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

// ── List Subjects ─────────────────────────────────────────────────────────────
function index(req, res) {
  const { semester, search, show_archived } = req.query;
  const isAdmin = req.session.user && req.session.user.role === 'admin';
  const includeArchived = isAdmin && show_archived === '1';

  const subjects = Subject.findAll({
    includeArchived,
    semester: semester || null,
    search: search || null
  });

  const semesters = Subject.getSemesters();

  res.render('subjects/index', {
    title: 'Subjects – La Kazarma',
    subjects,
    semesters,
    currentSemester: semester || '',
    search: search || '',
    showArchived: includeArchived,
    isAdmin
  });
}

// ── Subject Details ───────────────────────────────────────────────────────────
function show(req, res) {
  const { id } = req.params;
  const subject = Subject.findById(Number(id));

  if (!subject) {
    return res.status(404).render('error', {
      title: 'Subject Not Found',
      code: 404,
      message: 'The requested subject does not exist or has been removed.'
    });
  }

  const topics = Topic.findBySubjectId(subject.id);
  const materials = Material.findAll({ subjectId: subject.id });
  const assignments = Assignment.findAll({ subjectId: subject.id });
  const announcements = db.prepare(`
    SELECT sa.*, u.full_name AS author_name, u.role AS author_role
    FROM subject_announcements sa
    JOIN users u ON sa.author_id = u.id
    WHERE sa.subject_id = ?
    ORDER BY sa.created_at DESC
  `).all(subject.id);

  const isAdmin = req.session.user && req.session.user.role === 'admin';

  res.render('subjects/show', {
    title: `${subject.code ? subject.code + ' – ' : ''}${subject.name} – La Kazarma`,
    subject,
    topics,
    materials,
    assignments,
    announcements,
    activeTab: req.query.tab || 'overview',
    isAdmin
  });
}

// ── Create Subject (Admin) ────────────────────────────────────────────────────
function create(req, res) {
  const { name, code, description, semester, academic_year } = req.body;

  if (!name || !semester || !academic_year) {
    setFlash(req, 'error', 'Subject name, semester, and academic year are required.');
    return res.redirect('/subjects');
  }

  try {
    const subject = Subject.create({
      name,
      code,
      description,
      semester,
      academic_year,
      created_by: req.session.user.id
    });
    setFlash(req, 'success', `Subject "${subject.name}" created successfully.`);
    res.redirect(`/subjects/${subject.id}`);
  } catch (err) {
    console.error('[Subject Create Error]', err);
    setFlash(req, 'error', 'Could not create subject. Please check inputs.');
    res.redirect('/subjects');
  }
}

// ── Update Subject (Admin) ────────────────────────────────────────────────────
function update(req, res) {
  const { id } = req.params;
  const { name, code, description, semester, academic_year } = req.body;

  if (!name || !semester || !academic_year) {
    setFlash(req, 'error', 'Subject name, semester, and academic year are required.');
    return res.redirect(`/subjects/${id}`);
  }

  try {
    Subject.update(Number(id), { name, code, description, semester, academic_year });
    setFlash(req, 'success', 'Subject updated successfully.');
  } catch (err) {
    console.error('[Subject Update Error]', err);
    setFlash(req, 'error', 'Failed to update subject.');
  }
  res.redirect(`/subjects/${id}`);
}

// ── Toggle Archive (Admin) ────────────────────────────────────────────────────
function toggleArchive(req, res) {
  const { id } = req.params;
  const subject = Subject.findById(Number(id));
  if (!subject) {
    setFlash(req, 'error', 'Subject not found.');
    return res.redirect('/subjects');
  }

  const newStatus = subject.is_archived ? 0 : 1;
  Subject.setArchived(subject.id, newStatus);
  setFlash(req, 'success', `Subject "${subject.name}" has been ${newStatus ? 'archived' : 'unarchived'}.`);
  res.redirect('/subjects');
}

// ── Topics Management ─────────────────────────────────────────────────────────
function addTopic(req, res) {
  const { id } = req.params;
  const { name, description, order_index } = req.body;

  if (!name || !name.trim()) {
    setFlash(req, 'error', 'Topic name is required.');
    return res.redirect(`/subjects/${id}?tab=topics`);
  }

  Topic.create(Number(id), name, description, parseInt(order_index || '0', 10));
  setFlash(req, 'success', 'Topic added successfully.');
  res.redirect(`/subjects/${id}?tab=topics`);
}

function deleteTopic(req, res) {
  const { id, topicId } = req.params;
  Topic.delete(Number(topicId));
  setFlash(req, 'success', 'Topic removed.');
  res.redirect(`/subjects/${id}?tab=topics`);
}

// ── Subject Announcement (Admin) ──────────────────────────────────────────────
function addAnnouncement(req, res) {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    setFlash(req, 'error', 'Title and announcement content are required.');
    return res.redirect(`/subjects/${id}?tab=announcements`);
  }

  db.prepare(`
    INSERT INTO subject_announcements (subject_id, author_id, title, content)
    VALUES (?, ?, ?, ?)
  `).run(Number(id), req.session.user.id, title.trim(), content.trim());

  setFlash(req, 'success', 'Announcement posted.');
  res.redirect(`/subjects/${id}?tab=announcements`);
}

// ── JSON API: Get topics for a subject ────────────────────────────────────────
function getTopicsJson(req, res) {
  const { id } = req.params;
  const topics = Topic.findBySubjectId(Number(id));
  res.json({ success: true, topics });
}

module.exports = {
  index,
  show,
  create,
  update,
  toggleArchive,
  addTopic,
  deleteTopic,
  addAnnouncement,
  getTopicsJson
};

