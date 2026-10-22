const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const upload = require('../config/upload');

exports.index = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('profile/index', {
      title: 'My Profile',
      currentPage: 'profile',
      profileUser: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      req.flash('error', err.message || 'Upload failed.');
      return res.redirect('/profile');
    }
    try {
      const { name, bio } = req.body;
      const updates = { name, bio };
      if (req.file) {
        updates.avatar_url = '/uploads/' + req.file.filename;
        // Update session user
        req.session.user.avatar_url = updates.avatar_url;
      }
      const updated = await User.update(req.session.user.id, updates);
      req.session.user.name = updated.name;
      req.flash('success', 'Profile updated successfully.');
      res.redirect('/profile');
    } catch (err) {
      req.flash('error', 'Failed to update profile.');
      res.redirect('/profile');
    }
  });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/profile');
    }
    if (newPassword.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/profile');
    }
    const user = await User.findByEmail(req.session.user.email);
    const valid = await User.verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/profile');
    }
    await User.updatePassword(req.session.user.id, newPassword);
    req.flash('success', 'Password changed successfully.');
    res.redirect('/profile');
  } catch (err) {
    req.flash('error', 'Failed to change password.');
    res.redirect('/profile');
  }
};
