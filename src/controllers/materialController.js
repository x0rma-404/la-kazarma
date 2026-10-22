'use strict';

const path = require('path');
const fs = require('fs');
const Material = require('../models/Material');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Bookmark = require('../models/Bookmark');
const { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } = require('../config/upload');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ── List Materials with Filters, Sorting, and Pagination ──────────────────────
function index(req, res) {
  const {
    subject_id, topic_id, semester, category,
    file_type, search, sort, page
  } = req.query;

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  const filters = {
    subjectId: subject_id ? Number(subject_id) : null,
    topicId: topic_id ? Number(topic_id) : null,
    semester: semester || null,
    category: category || null,
    fileType: file_type || null,
    search: search || null,
    sort: sort || 'newest',
    limit,
    offset
  };

  const totalMaterials = Material.count(filters);
  const materials = Material.findAll(filters);
  const totalPages = Math.ceil(totalMaterials / limit) || 1;

  const subjects = Subject.findAll({ includeArchived: false });
  const semesters = Subject.getSemesters();
  const categories = Material.getCategories();
  const fileTypes = Material.getFileTypes();

  let topics = [];
  if (filters.subjectId) {
    topics = Topic.findBySubjectId(filters.subjectId);
  }

  res.render('materials/index', {
    title: 'Study Materials – La Kazarma',
    materials,
    subjects,
    topics,
    semesters,
    categories,
    fileTypes,
    filters,
    currentPage,
    totalPages,
    totalMaterials,
    formatBytes
  });
}

// ── Show Upload Page ──────────────────────────────────────────────────────────
function showUpload(req, res) {
  const subjects = Subject.findAll({ includeArchived: false });
  const categories = Material.getCategories();
  const selectedSubjectId = req.query.subject_id ? Number(req.query.subject_id) : null;
  const selectedTopicId = req.query.topic_id ? Number(req.query.topic_id) : null;

  let topics = [];
  if (selectedSubjectId) {
    topics = Topic.findBySubjectId(selectedSubjectId);
  }

  res.render('materials/upload', {
    title: 'Upload Study Material – La Kazarma',
    subjects,
    categories,
    topics,
    selectedSubjectId,
    selectedTopicId,
    allowedExtensions: ALLOWED_EXTENSIONS,
    maxFileSizeMb: Math.round(MAX_FILE_SIZE / (1024 * 1024))
  });
}

// ── Handle Upload ─────────────────────────────────────────────────────────────
function upload(req, res) {
  if (!req.file) {
    setFlash(req, 'error', 'Please choose a file to upload.');
    return res.redirect('/materials/upload');
  }

  const { title, description, subject_id, topic_id, category, tags } = req.body;

  if (!title || !subject_id || !category) {
    // Clean up uploaded file
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    setFlash(req, 'error', 'Title, subject, and category are required.');
    return res.redirect('/materials/upload');
  }

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

  try {
    const material = Material.create({
      title,
      description,
      subject_id: Number(subject_id),
      topic_id: topic_id ? Number(topic_id) : null,
      category,
      uploader_id: req.session.user.id,
      file_path: req.file.path,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      file_type: ext,
      file_size: req.file.size,
      tags: tags || '',
      is_approved: 1
    });

    setFlash(req, 'success', `"${material.title}" uploaded successfully!`);
    res.redirect(`/materials/${material.id}`);
  } catch (err) {
    console.error('[Material Upload Error]', err);
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    setFlash(req, 'error', 'Failed to save material record.');
    res.redirect('/materials/upload');
  }
}

// ── Material Details ──────────────────────────────────────────────────────────
function show(req, res) {
  const { id } = req.params;
  const currentUserId = req.session.user ? req.session.user.id : null;
  const material = Material.findById(Number(id), currentUserId);

  if (!material) {
    return res.status(404).render('error', {
      title: 'Material Not Found',
      code: 404,
      message: 'The requested material does not exist or has been deleted.'
    });
  }

  const isOwner = currentUserId && material.uploader_id === currentUserId;
  const isAdmin = req.session.user && req.session.user.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const subjects = canEdit ? Subject.findAll({ includeArchived: false }) : [];
  const topics = canEdit ? Topic.findBySubjectId(material.subject_id) : [];
  const categories = canEdit ? Material.getCategories() : [];

  const previewable = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'].includes(material.file_type);

  res.render('materials/show', {
    title: `${material.title} – La Kazarma`,
    material,
    isOwner,
    isAdmin,
    canEdit,
    subjects,
    topics,
    categories,
    previewable,
    formatBytes
  });
}

// ── Download Material ─────────────────────────────────────────────────────────
function download(req, res) {
  const { id } = req.params;
  const material = Material.findById(Number(id));

  if (!material) {
    setFlash(req, 'error', 'File not found.');
    return res.redirect('/materials');
  }

  if (!fs.existsSync(material.file_path)) {
    setFlash(req, 'error', 'The file is no longer available on disk.');
    return res.redirect(`/materials/${material.id}`);
  }

  res.download(material.file_path, material.original_name);
}

// ── Inline Preview Raw File ───────────────────────────────────────────────────
function preview(req, res) {
  const { id } = req.params;
  const material = Material.findById(Number(id));

  if (!material || !fs.existsSync(material.file_path)) {
    return res.status(404).send('File not found');
  }

  const mimeMap = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    txt: 'text/plain'
  };

  const contentType = mimeMap[material.file_type] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(material.original_name)}"`);
  fs.createReadStream(material.file_path).pipe(res);
}

// ── Update Metadata ───────────────────────────────────────────────────────────
function update(req, res) {
  const { id } = req.params;
  const material = Material.findById(Number(id));

  if (!material) {
    setFlash(req, 'error', 'Material not found.');
    return res.redirect('/materials');
  }

  const isOwner = req.session.user && material.uploader_id === req.session.user.id;
  const isAdmin = req.session.user && req.session.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).render('error', {
      title: '403 – Forbidden',
      code: 403,
      message: 'You can only edit materials you uploaded.'
    });
  }

  const { title, description, subject_id, topic_id, category, tags } = req.body;

  if (!title || !subject_id || !category) {
    setFlash(req, 'error', 'Title, subject, and category are required.');
    return res.redirect(`/materials/${id}`);
  }

  Material.update(Number(id), {
    title,
    description,
    subject_id: Number(subject_id),
    topic_id: topic_id ? Number(topic_id) : null,
    category,
    tags
  });

  setFlash(req, 'success', 'Material updated successfully.');
  res.redirect(`/materials/${id}`);
}

// ── Delete Material ───────────────────────────────────────────────────────────
function deleteMaterial(req, res) {
  const { id } = req.params;
  const material = Material.findById(Number(id));

  if (!material) {
    setFlash(req, 'error', 'Material not found.');
    return res.redirect('/materials');
  }

  const isOwner = req.session.user && material.uploader_id === req.session.user.id;
  const isAdmin = req.session.user && req.session.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).render('error', {
      title: '403 – Forbidden',
      code: 403,
      message: 'You can only delete materials you uploaded.'
    });
  }

  // Remove file from disk
  try {
    if (fs.existsSync(material.file_path)) {
      fs.unlinkSync(material.file_path);
    }
  } catch (err) {
    console.error('[File Deletion Error]', err);
  }

  Material.delete(Number(id));
  setFlash(req, 'success', `"${material.title}" has been deleted.`);
  res.redirect('/materials');
}

// ── Toggle Bookmark ───────────────────────────────────────────────────────────
function toggleBookmark(req, res) {
  const { id } = req.params;
  const userId = req.session.user.id;

  const isNowBookmarked = Bookmark.toggle(userId, Number(id));

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, bookmarked: isNowBookmarked });
  }

  setFlash(req, 'success', isNowBookmarked ? 'Material added to bookmarks.' : 'Bookmark removed.');
  res.redirect(req.headers.referer || `/materials/${id}`);
}

// ── Bookmarks List ────────────────────────────────────────────────────────────
function showBookmarks(req, res) {
  const userId = req.session.user.id;
  const bookmarks = Bookmark.findByUser(userId);

  res.render('bookmarks/index', {
    title: 'My Bookmarks – La Kazarma',
    bookmarks,
    formatBytes
  });
}

module.exports = {
  index,
  showUpload,
  upload,
  show,
  download,
  preview,
  update,
  deleteMaterial,
  toggleBookmark,
  showBookmarks
};

