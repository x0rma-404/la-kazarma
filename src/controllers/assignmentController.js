const Assignment = require('../models/Assignment');
const Solution = require('../models/Solution');
const Subject = require('../models/Subject');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');

exports.index = async (req, res, next) => {
  try {
    const assignments = await Assignment.findAll();
    const subjects = await Subject.findAll();
    res.render('assignments/index', {
      title: 'Assignments',
      currentPage: 'assignments',
      assignments,
      subjects,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByIdWithSolutions(req.params.id);
    if (!assignment) {
      req.flash('error', 'Assignment not found.');
      return res.redirect('/assignments');
    }
    const mySolution = await Solution.findByAssignmentAndUser(req.params.id, req.session.user.id);
    const isAdmin = req.session.user.role === 'admin';
    res.render('assignments/show', {
      title: assignment.title,
      currentPage: 'assignments',
      assignment,
      mySolution,
      isAdmin,
    });
  } catch (err) {
    next(err);
  }
};

exports.getNew = async (req, res, next) => {
  try {
    const subjects = await Subject.findAll();
    res.render('assignments/new', {
      title: 'New Assignment',
      currentPage: 'assignments',
      subjects,
    });
  } catch (err) {
    next(err);
  }
};

exports.postNew = async (req, res, next) => {
  try {
    const { subject_id, title, description, due_date, max_score } = req.body;
    await Assignment.create({
      subject_id,
      title,
      description,
      due_date: due_date || null,
      max_score: max_score || 100,
      created_by: req.session.user.id,
    });
    req.flash('success', 'Assignment created successfully.');
    res.redirect('/assignments');
  } catch (err) {
    req.flash('error', 'Failed to create assignment.');
    res.redirect('/assignments/new');
  }
};

exports.delete = async (req, res, next) => {
  try {
    await Assignment.delete(req.params.id);
    req.flash('success', 'Assignment deleted.');
    res.redirect('/assignments');
  } catch (err) {
    req.flash('error', 'Failed to delete assignment.');
    res.redirect('/assignments');
  }
};

exports.submitSolution = async (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      req.flash('error', err.message || 'Upload failed.');
      return res.redirect('/assignments/' + req.params.id);
    }
    try {
      const { content } = req.body;
      const existing = await Solution.findByAssignmentAndUser(req.params.id, req.session.user.id);
      if (existing) {
        req.flash('error', 'You have already submitted a solution for this assignment.');
        return res.redirect('/assignments/' + req.params.id);
      }
      let fileUrl = null;
      if (req.file) {
        fileUrl = '/uploads/' + req.file.filename;
      }
      await Solution.create({
        assignment_id: req.params.id,
        user_id: req.session.user.id,
        content,
        file_url: fileUrl,
      });
      req.flash('success', 'Solution submitted successfully.');
      res.redirect('/assignments/' + req.params.id);
    } catch (err) {
      req.flash('error', 'Failed to submit solution.');
      res.redirect('/assignments/' + req.params.id);
    }
  });
};

exports.gradeSolution = async (req, res, next) => {
  try {
    const { solutionId, score, feedback } = req.body;
    await Solution.grade(solutionId, parseInt(score), feedback);
    req.flash('success', 'Solution graded successfully.');
    res.redirect('/assignments/' + req.params.id);
  } catch (err) {
    req.flash('error', 'Failed to grade solution.');
    res.redirect('/assignments/' + req.params.id);
  }
};
