'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const InvitationCode = require('../models/InvitationCode');
const Setting = require('../models/Setting');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

// ── Profile ───────────────────────────────────────────────────────────────────
function show(req, res) {
  const user = User.findById(req.session.user.id);
  res.render('profile/index', { title: 'My Profile – La Kazarma', profileUser: user });
}

async function update(req, res) {
  const { full_name, email, bio } = req.body;
  const userId = req.session.user.id;

  if (!full_name || full_name.trim().length < 2) {
    setFlash(req, 'error', 'Full name must be at least 2 characters.');
    return res.redirect('/profile');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFlash(req, 'error', 'A valid email is required.');
    return res.redirect('/profile');
  }

  // Check email uniqueness (allow same user)
  const existing = User.findByEmail(email.trim().toLowerCase());
  if (existing && existing.id !== userId) {
    setFlash(req, 'error', 'That email is already in use by another account.');
    return res.redirect('/profile');
  }

  const updated = User.updateProfile(userId, {
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    bio: (bio || '').trim()
  });

  // Refresh session
  req.session.user.full_name = updated.full_name;
  req.session.user.email = updated.email;

  setFlash(req, 'success', 'Profile updated successfully.');
  res.redirect('/profile');
}

// ── Settings ──────────────────────────────────────────────────────────────────
function showSettings(req, res) {
  const user = User.findById(req.session.user.id);
  res.render('settings/index', { title: 'Settings – La Kazarma', profileUser: user });
}

async function changePassword(req, res) {
  const { old_password, new_password, confirm_new_password } = req.body;
  const user = User.findById(req.session.user.id);

  const match = await bcrypt.compare(old_password || '', user.password_hash);
  if (!match) {
    setFlash(req, 'error', 'Current password is incorrect.');
    return res.redirect('/settings');
  }

  if (!new_password || new_password.length < 8) {
    setFlash(req, 'error', 'New password must be at least 8 characters.');
    return res.redirect('/settings');
  }

  if (new_password !== confirm_new_password) {
    setFlash(req, 'error', 'New passwords do not match.');
    return res.redirect('/settings');
  }

  User.updatePassword(user.id, new_password);
  setFlash(req, 'success', 'Password changed successfully.');
  res.redirect('/settings');
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function showAdmin(req, res) {
  const allUsers   = User.findAll();
  const pending    = User.findPending();
  const invCodes   = InvitationCode.findAll();
  const settings   = Setting.getAll();

  res.render('admin/index', {
    title: 'Admin Panel – La Kazarma',
    allUsers,
    pending,
    invCodes,
    settings
  });
}

function updateSettings(req, res) {
  const { max_file_size_mb, allowed_file_types, allow_zip_uploads, content_moderation_enabled } = req.body;
  if (max_file_size_mb) Setting.set('max_file_size_mb', max_file_size_mb);
  if (allowed_file_types) Setting.set('allowed_file_types', allowed_file_types);
  Setting.set('allow_zip_uploads', allow_zip_uploads ? '1' : '0');
  Setting.set('content_moderation_enabled', content_moderation_enabled ? '1' : '0');

  setFlash(req, 'success', 'Platform settings updated successfully.');
  res.redirect('/admin');
}

function approveUser(req, res) {
  const { id } = req.params;
  User.updateStatus(parseInt(id, 10), 'approved');
  res.json({ success: true, status: 'approved' });
}

function rejectUser(req, res) {
  const { id } = req.params;
  User.updateStatus(parseInt(id, 10), 'rejected');
  res.json({ success: true, status: 'rejected' });
}

function suspendUser(req, res) {
  const { id } = req.params;
  const target = User.findById(parseInt(id, 10));
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') return res.status(403).json({ error: 'Cannot suspend admin' });
  User.updateStatus(parseInt(id, 10), 'suspended');
  res.json({ success: true, status: 'suspended' });
}

function reactivateUser(req, res) {
  const { id } = req.params;
  User.updateStatus(parseInt(id, 10), 'approved');
  res.json({ success: true, status: 'approved' });
}

function createInvitationCode(req, res) {
  const code = InvitationCode.generateCode();
  const newCode = InvitationCode.create(code, req.session.user.id, null);
  res.json({ success: true, code: newCode });
}

function deactivateInvitationCode(req, res) {
  const { id } = req.params;
  InvitationCode.deactivate(parseInt(id, 10));
  res.json({ success: true });
}

module.exports = {
  show, update,
  showSettings, changePassword,
  showAdmin, updateSettings,
  approveUser, rejectUser, suspendUser, reactivateUser,
  createInvitationCode, deactivateInvitationCode
};
