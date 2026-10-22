'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const InvitationCode = require('../models/InvitationCode');
const { sendPasswordReset } = require('../config/mailer');

// ── Helpers ───────────────────────────────────────────────────────────────────
function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

// ── Show Login ────────────────────────────────────────────────────────────────
function showLogin(req, res) {
  res.render('auth/login', { title: 'Login – La Kazarma' });
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(req, res) {
  const { identifier, password, remember } = req.body;

  if (!identifier || !password) {
    setFlash(req, 'error', 'Please enter your credentials.');
    return res.redirect('/login');
  }

  const user = User.findByUsernameOrCode(identifier.trim());

  if (!user) {
    setFlash(req, 'error', 'Invalid username/student code or password.');
    return res.redirect('/login');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    setFlash(req, 'error', 'Invalid username/student code or password.');
    return res.redirect('/login');
  }

  if (user.status === 'pending') {
    setFlash(req, 'warning', 'Your account is awaiting admin approval.');
    return res.redirect('/login');
  }
  if (user.status === 'suspended') {
    setFlash(req, 'error', 'Your account has been suspended. Contact an administrator.');
    return res.redirect('/login');
  }
  if (user.status === 'rejected') {
    setFlash(req, 'error', 'Your account registration was rejected.');
    return res.redirect('/login');
  }

  // Set session
  req.session.user = {
    id: user.id,
    username: user.username,
    student_code: user.student_code,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar_url: user.avatar_url
  };

  if (remember) {
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
  }

  User.recordLogin(user.id);
  setFlash(req, 'success', `Welcome back, ${user.full_name.split(' ')[0]}!`);
  res.redirect('/dashboard');
}

// ── Logout ────────────────────────────────────────────────────────────────────
function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

// ── Show Register ─────────────────────────────────────────────────────────────
function showRegister(req, res) {
  res.render('auth/register', { title: 'Register – La Kazarma' });
}

// ── Register ──────────────────────────────────────────────────────────────────
async function register(req, res) {
  const {
    full_name, username, student_code, email,
    invitation_code, password, confirm_password
  } = req.body;

  // Basic validation
  const errors = [];
  if (!full_name || full_name.trim().length < 2) errors.push('Full name must be at least 2 characters.');
  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) errors.push('Username must be 3-20 characters (letters, numbers, underscore).');
  if (!student_code || student_code.trim().length < 2) errors.push('Student code is required.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email address is required.');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters.');
  if (password !== confirm_password) errors.push('Passwords do not match.');

  if (errors.length) {
    setFlash(req, 'error', errors[0]);
    return res.redirect('/register');
  }

  // Check uniqueness
  if (User.findByUsername(username.trim())) {
    setFlash(req, 'error', 'That username is already taken.');
    return res.redirect('/register');
  }
  if (User.findByStudentCode(student_code.trim())) {
    setFlash(req, 'error', 'That student code is already registered.');
    return res.redirect('/register');
  }
  if (User.findByEmail(email.trim())) {
    setFlash(req, 'error', 'That email address is already in use.');
    return res.redirect('/register');
  }

  // Invitation code
  let status = 'pending';
  let invCode = null;

  if (invitation_code && invitation_code.trim()) {
    invCode = InvitationCode.findByCode(invitation_code.trim());
    if (!invCode || !invCode.is_active) {
      setFlash(req, 'error', 'Invalid or expired invitation code.');
      return res.redirect('/register');
    }
    if (invCode.expires_at && invCode.expires_at < Math.floor(Date.now() / 1000)) {
      setFlash(req, 'error', 'That invitation code has expired.');
      return res.redirect('/register');
    }
    status = 'approved';
  }

  // Create user
  const newUser = User.create({
    username: username.trim(),
    student_code: student_code.trim().toUpperCase(),
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'student',
    status
  });

  // Mark invitation code used
  if (invCode) {
    InvitationCode.markUsed(invCode.code, newUser.id);
  }

  if (status === 'approved') {
    setFlash(req, 'success', 'Account created! You can now log in.');
  } else {
    setFlash(req, 'info', 'Registration submitted. Your account is awaiting admin approval.');
  }
  res.redirect('/login');
}

// ── Show Forgot Password ──────────────────────────────────────────────────────
function showForgotPassword(req, res) {
  res.render('auth/forgot-password', { title: 'Forgot Password – La Kazarma' });
}

// ── Forgot Password ───────────────────────────────────────────────────────────
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    setFlash(req, 'error', 'Please enter your email address.');
    return res.redirect('/forgot-password');
  }

  const user = User.findByEmail(email.trim().toLowerCase());

  // Always show success to prevent user enumeration
  setFlash(req, 'success', 'If that email is registered, a reset link has been sent.');

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    User.setResetToken(user.id, token, expires);
    try {
      await sendPasswordReset(user.email, token, req);
    } catch (err) {
      console.error('[MAILER ERROR]', err.message);
    }
  }

  res.redirect('/login');
}

// ── Show Reset Password ───────────────────────────────────────────────────────
function showResetPassword(req, res) {
  const { token } = req.query;
  if (!token) {
    setFlash(req, 'error', 'Invalid or missing reset token.');
    return res.redirect('/forgot-password');
  }
  const user = User.findByResetToken(token);
  if (!user) {
    setFlash(req, 'error', 'This reset link is invalid or has expired.');
    return res.redirect('/forgot-password');
  }
  res.render('auth/reset-password', { title: 'Reset Password – La Kazarma', token });
}

// ── Reset Password ────────────────────────────────────────────────────────────
async function resetPassword(req, res) {
  const { token, password, confirm_password } = req.body;

  if (!token) {
    setFlash(req, 'error', 'Missing reset token.');
    return res.redirect('/forgot-password');
  }

  const user = User.findByResetToken(token);
  if (!user) {
    setFlash(req, 'error', 'This reset link is invalid or has expired.');
    return res.redirect('/forgot-password');
  }

  if (!password || password.length < 8) {
    setFlash(req, 'error', 'Password must be at least 8 characters.');
    return res.redirect(`/reset-password?token=${token}`);
  }

  if (password !== confirm_password) {
    setFlash(req, 'error', 'Passwords do not match.');
    return res.redirect(`/reset-password?token=${token}`);
  }

  User.updatePassword(user.id, password);
  User.clearResetToken(user.id);

  setFlash(req, 'success', 'Password updated successfully. Please log in.');
  res.redirect('/login');
}

module.exports = {
  showLogin, login, logout,
  showRegister, register,
  showForgotPassword, forgotPassword,
  showResetPassword, resetPassword
};
