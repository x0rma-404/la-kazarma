const Material = require('../models/Material');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Bookmark = require('../models/Bookmark');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');

exports.index = async (req, res, next) => {
  try {
    const materials = await Material.findAll();
    const subjects = await Subject.findAll();
    const bookmarkedIds = await Bookmark.getBookmarkedIds(req.session.user.id);
    res.render('materials/index', {
      title: 'Materials',
      currentPage: 'materials',
      materials,
      subjects,
      bookmarkedIds,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      req.flash('error', 'Material not found.');
      return res.redirect('/materials');
    }
    const isBookmarked = await Bookmark.isBookmarked(req.session.user.id, req.params.id);
    res.render('materials/show', {
      title: material.title,
      currentPage: 'materials',
      material,
      isBookmarked,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUpload = async (req, res, next) => {
  try {
    const subjects = await Subject.findAll();
    const subjectId = req.query.subject_id;
    let topics = [];
    if (subjectId) {
      topics = await Topic.findBySubject(subjectId);
    }
    res.render('materials/upload', {
      title: 'Upload Material',
      currentPage: 'materials',
      subjects,
      topics,
      subjectId,
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpload = async (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      req.flash('error', err.message || 'Upload failed.');
      return res.redirect('/materials/upload');
    }
    try {
      if (!req.file) {
        req.flash('error', 'Please select a file to upload.');
        return res.redirect('/materials/upload');
      }
      const { subject_id, topic_id, title, description } = req.body;
      const fileUrl = '/uploads/' + req.file.filename;
      const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();

      await Material.create({
        subject_id,
        topic_id: topic_id || null,
        title,
        description,
        file_url: fileUrl,
        file_type: fileType,
        file_size: req.file.size,
        uploaded_by: req.session.user.id,
      });

      req.flash('success', 'Material uploaded successfully.');
      res.redirect('/materials');
    } catch (err) {
      req.flash('error', 'Failed to upload material.');
      res.redirect('/materials/upload');
    }
  });
};

exports.delete = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    if (material && material.file_url) {
      const filePath = path.join(__dirname, '..', '..', material.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await Material.delete(req.params.id);
    req.flash('success', 'Material deleted.');
    res.redirect('/materials');
  } catch (err) {
    req.flash('error', 'Failed to delete material.');
    res.redirect('/materials');
  }
};
