'use strict';

const path = require('path');
const fs = require('fs');
const Assignment = require('../models/Assignment');
const Solution = require('../models/Solution');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } = require('../config/upload');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ── List Assignments ──────────────────────────────────────────────────────────
function index(req, res) {
  const { subject_id, topic_id, status, search, page } = req.query;

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 10;
  const offset = (currentPage - 1) * limit;

  const filters = {
    subjectId: subject_id ? Number(subject_id) : null,
    topicId: topic_id ? Number(topic_id) : null,
    status: status || 'all',
    search: search || null,
    limit,
    offset
  };

  const totalAssignments = Assignment.count(filters);
  const assignments = Assignment.findAll(filters);
  const totalPages = Math.ceil(totalAssignments / limit) || 1;

  const subjects = Subject.findAll({ includeArchived: false });
  let topics = [];
  if (filters.subjectId) {
    topics = Topic.findBySubjectId(filters.subjectId);
  }

  res.render('assignments/index', {
    title: 'Assignments – La Kazarma',
    assignments,
    subjects,
    topics,
    filters,
    currentPage,
    totalPages,
    totalAssignments,
    formatBytes
  });
}

// ── Show Create Assignment Page ───────────────────────────────────────────────
function showCreate(req, res) {
  const subjects = Subject.findAll({ includeArchived: false });
  const selectedSubjectId = req.query.subject_id ? Number(req.query.subject_id) : null;
  let topics = [];
  if (selectedSubjectId) {
    topics = Topic.findBySubjectId(selectedSubjectId);
  }

  res.render('assignments/new', {
    title: 'Create Assignment – La Kazarma',
    subjects,
    topics,
    selectedSubjectId,
    allowedExtensions: ALLOWED_EXTENSIONS,
    maxFileSizeMb: Math.round(MAX_FILE_SIZE / (1024 * 1024))
  });
}

// ── Create Assignment ─────────────────────────────────────────────────────────
function create(req, res) {
  const { title, description, subject_id, topic_id, deadline_date, deadline_time, tags } = req.body;

  if (!title || !subject_id) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    setFlash(req, 'error', 'Assignment title and subject are required.');
    return res.redirect('/assignments/new');
  }

  let deadline = null;
  if (deadline_date) {
    const dateTimeStr = deadline_time ? `${deadline_date}T${deadline_time}` : `${deadline_date}T23:59:59`;
    const parsed = new Date(dateTimeStr);
    if (!isNaN(parsed.getTime())) {
      deadline = Math.floor(parsed.getTime() / 1000);
    }
  }

  let file_path = null, file_name = null, original_name = null, file_type = null, file_size = 0;
  if (req.file) {
    file_path = req.file.path;
    file_name = req.file.filename;
    original_name = req.file.originalname;
    file_type = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    file_size = req.file.size;
  }

  try {
    const assignment = Assignment.create({
      title,
      description,
      subject_id: Number(subject_id),
      topic_id: topic_id ? Number(topic_id) : null,
      uploader_id: req.session.user.id,
      file_path,
      file_name,
      original_name,
      file_type,
      file_size,
      deadline,
      tags
    });

    setFlash(req, 'success', `Assignment "${assignment.title}" created successfully!`);
    res.redirect(`/assignments/${assignment.id}`);
  } catch (err) {
    console.error('[Assignment Create Error]', err);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    setFlash(req, 'error', 'Could not create assignment.');
    res.redirect('/assignments/new');
  }
}

// ── Assignment Details & Solutions Workspace ──────────────────────────────────
function show(req, res) {
  const { id } = req.params;
  const assignment = Assignment.findById(Number(id));

  if (!assignment) {
    return res.status(404).render('error', {
      title: 'Assignment Not Found',
      code: 404,
      message: 'The requested assignment does not exist or has been removed.'
    });
  }

  const solutions = Solution.findByAssignmentId(assignment.id);
  const currentUserId = req.session.user.id;
  const isOwner = assignment.uploader_id === currentUserId;
  const isAdmin = req.session.user.role === 'admin';
  const mySolutions = solutions.filter(s => s.student_id === currentUserId);

  res.render('assignments/show', {
    title: `${assignment.title} – La Kazarma`,
    assignment,
    solutions,
    mySolutions,
    isOwner,
    isAdmin,
    currentUserId,
    allowedExtensions: ALLOWED_EXTENSIONS,
    formatBytes
  });
}

// ── Download Original Assignment File ─────────────────────────────────────────
function downloadOriginal(req, res) {
  const { id } = req.params;
  const assignment = Assignment.findById(Number(id));

  if (!assignment || !assignment.file_path) {
    setFlash(req, 'error', 'Original file not found.');
    return res.redirect(`/assignments/${id}`);
  }

  if (!fs.existsSync(assignment.file_path)) {
    setFlash(req, 'error', 'The file is no longer available on disk.');
    return res.redirect(`/assignments/${id}`);
  }

  res.download(assignment.file_path, assignment.original_name);
}

// ── Submit Solution ───────────────────────────────────────────────────────────
function submitSolution(req, res) {
  const { id } = req.params;
  const assignment = Assignment.findById(Number(id));

  if (!assignment) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) {}
    setFlash(req, 'error', 'Assignment not found.');
    return res.redirect('/assignments');
  }

  if (!req.file) {
    setFlash(req, 'error', 'Please attach your solution file.');
    return res.redirect(`/assignments/${id}`);
  }

  const { title, notes } = req.body;
  const solutionTitle = title && title.trim() ? title.trim() : `${req.session.user.full_name}'s Solution`;
  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

  try {
    Solution.create({
      assignment_id: assignment.id,
      student_id: req.session.user.id,
      title: solutionTitle,
      notes: notes || '',
      file_path: req.file.path,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      file_type: ext,
      file_size: req.file.size
    });

    setFlash(req, 'success', 'Solution submitted successfully!');
    res.redirect(`/assignments/${id}`);
  } catch (err) {
    console.error('[Solution Submit Error]', err);
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    setFlash(req, 'error', 'Failed to save solution.');
    res.redirect(`/assignments/${id}`);
  }
}

// ── Download Solution File ────────────────────────────────────────────────────
function downloadSolution(req, res) {
  const { solutionId } = req.params;
  const solution = Solution.findById(Number(solutionId));

  if (!solution) {
    setFlash(req, 'error', 'Solution not found.');
    return res.redirect('/assignments');
  }

  if (!fs.existsSync(solution.file_path)) {
    setFlash(req, 'error', 'The solution file is missing from disk.');
    return res.redirect(`/assignments/${solution.assignment_id}`);
  }

  res.download(solution.file_path, solution.original_name);
}

// ── Delete Solution ───────────────────────────────────────────────────────────
function deleteSolution(req, res) {
  const { id, solutionId } = req.params;
  const solution = Solution.findById(Number(solutionId));

  if (!solution) {
    setFlash(req, 'error', 'Solution not found.');
    return res.redirect(`/assignments/${id}`);
  }

  const isOwner = solution.student_id === req.session.user.id;
  const isAdmin = req.session.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).render('error', {
      title: '403 – Forbidden',
      code: 403,
      message: 'You can only delete your own solutions.'
    });
  }

  try {
    if (fs.existsSync(solution.file_path)) {
      fs.unlinkSync(solution.file_path);
    }
  } catch (e) {}

  Solution.delete(Number(solutionId));
  setFlash(req, 'success', 'Solution deleted.');
  res.redirect(`/assignments/${id}`);
}

// ── Delete Assignment ─────────────────────────────────────────────────────────
function deleteAssignment(req, res) {
  const { id } = req.params;
  const assignment = Assignment.findById(Number(id));

  if (!assignment) {
    setFlash(req, 'error', 'Assignment not found.');
    return res.redirect('/assignments');
  }

  const isOwner = assignment.uploader_id === req.session.user.id;
  const isAdmin = req.session.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).render('error', {
      title: '403 – Forbidden',
      code: 403,
      message: 'You can only delete assignments you created.'
    });
  }

  // Delete attached original file if any
  if (assignment.file_path && fs.existsSync(assignment.file_path)) {
    try { fs.unlinkSync(assignment.file_path); } catch (e) {}
  }

  Assignment.delete(Number(id));
  setFlash(req, 'success', `Assignment "${assignment.title}" deleted.`);
  res.redirect('/assignments');
}

module.exports = {
  index,
  showCreate,
  create,
  show,
  downloadOriginal,
  submitSolution,
  downloadSolution,
  deleteSolution,
  deleteAssignment
};

