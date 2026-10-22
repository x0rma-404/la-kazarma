const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

router.get('/', async (req, res, next) => {
  try {
    const settings = await Setting.getAll();
    res.render('settings/index', {
      title: 'Settings',
      currentPage: 'settings',
      settings,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { siteName, siteDescription } = req.body;
    if (siteName !== undefined) await Setting.set('siteName', siteName);
    if (siteDescription !== undefined) await Setting.set('siteDescription', siteDescription);
    req.flash('success', 'Settings saved.');
    res.redirect('/settings');
  } catch (err) {
    req.flash('error', 'Failed to save settings.');
    res.redirect('/settings');
  }
});

module.exports = router;
