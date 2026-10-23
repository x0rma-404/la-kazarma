const express = require('express');
const router = express.Router();
const User = require('../models/User');
const InvitationCode = require('../models/InvitationCode');
const Subject = require('../models/Subject');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Solution = require('../models/Solution');
const Setting = require('../models/Setting');

router.get('/', async (req, res, next) => {
  try {
    const [users, codes, subjects, materials, assignments] = await Promise.all([
      User.findAll(),
      InvitationCode.findAll(),
      Subject.findAll(),
      Material.findAll(),
      Assignment.findAll(),
    ]);

    const stats = {
      users: users.length,
      subjects: subjects.length,
      materials: materials.length,
      assignments: assignments.length,
    };

    res.render('admin/index', {
      title: 'Admin Panel',
      currentPage: 'admin',
      users,
      codes,
      subjects,
      materials,
      assignments,
      stats,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/invitation-codes', async (req, res, next) => {
  try {
    const code = await InvitationCode.create(req.session.user.id);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invitation code.' });
  }
});

router.post('/invitations', async (req, res, next) => {
  try {
    const code = await InvitationCode.create(req.session.user.id);
    req.flash('success', 'Invitation code generated.');
    res.redirect('/admin');
  } catch (err) {
    req.flash('error', 'Failed to generate invitation code.');
    res.redirect('/admin');
  }
});

router.post('/invitations/:id/delete', async (req, res, next) => {
  try {
    await InvitationCode.delete(req.params.id);
    req.flash('success', 'Invitation code deleted.');
    res.redirect('/admin');
  } catch (err) {
    req.flash('error', 'Failed to delete invitation code.');
    res.redirect('/admin');
  }
});

router.post('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      req.flash('error', 'Invalid role.');
      return res.redirect('/admin');
    }
    await User.update(req.params.id, { role });
    req.flash('success', 'User role updated.');
    res.redirect('/admin');
  } catch (err) {
    req.flash('error', 'Failed to update user role.');
    res.redirect('/admin');
  }
});

router.post('/settings', async (req, res, next) => {
  try {
    const keys = ['max_file_size_mb', 'allowed_file_types', 'allow_zip_uploads', 'content_moderation_enabled', 'siteName', 'siteDescription'];
    for (const key of keys) {
      if (req.body[key] !== undefined) {
        await Setting.set(key, req.body[key]);
      }
    }
    req.flash('success', 'Settings saved.');
    res.redirect('/admin');
  } catch (err) {
    req.flash('error', 'Failed to save settings.');
    res.redirect('/admin');
  }
});

module.exports = router;
