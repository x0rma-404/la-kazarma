const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');

exports.index = async (req, res, next) => {
  try {
    const subjects = await Subject.findAll();
    res.render('subjects/index', {
      title: 'Subjects',
      currentPage: 'subjects',
      subjects,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdWithDetails(req.params.id);
    if (!subject) {
      req.flash('error', 'Subject not found.');
      return res.redirect('/subjects');
    }
    const materials = await Material.findBySubject(req.params.id);
    const assignments = await Assignment.findBySubject(req.params.id);

    res.render('subjects/show', {
      title: subject.name,
      currentPage: 'subjects',
      subject,
      materials,
      assignments,
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, code, description, semester } = req.body;
    await Subject.create({ name, code, description, semester });
    req.flash('success', 'Subject created successfully.');
    res.redirect('/subjects');
  } catch (err) {
    req.flash('error', 'Failed to create subject.');
    res.redirect('/subjects');
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, code, description, semester } = req.body;
    await Subject.update(req.params.id, { name, code, description, semester });
    req.flash('success', 'Subject updated successfully.');
    res.redirect('/subjects/' + req.params.id);
  } catch (err) {
    req.flash('error', 'Failed to update subject.');
    res.redirect('/subjects/' + req.params.id);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await Subject.delete(req.params.id);
    req.flash('success', 'Subject deleted.');
    res.redirect('/subjects');
  } catch (err) {
    req.flash('error', 'Failed to delete subject.');
    res.redirect('/subjects');
  }
};

exports.createTopic = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    await Topic.create({ subject_id: req.params.id, name, description });
    req.flash('success', 'Topic added successfully.');
    res.redirect('/subjects/' + req.params.id);
  } catch (err) {
    req.flash('error', 'Failed to add topic.');
    res.redirect('/subjects/' + req.params.id);
  }
};

exports.deleteTopic = async (req, res, next) => {
  try {
    await Topic.delete(req.params.topicId);
    req.flash('success', 'Topic deleted.');
    res.redirect('/subjects/' + req.params.id);
  } catch (err) {
    req.flash('error', 'Failed to delete topic.');
    res.redirect('/subjects/' + req.params.id);
  }
};
