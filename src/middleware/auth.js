'use strict';

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'You must be logged in to access that page.' };
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: '403 – Forbidden',
      code: 403,
      message: 'You do not have permission to access this area.'
    });
  }
  next();
}

function requireApproved(req, res, next) {
  const user = req.session.user;
  if (!user) return next();

  if (user.status === 'pending') {
    req.session.flash = {
      type: 'warning',
      message: 'Your account is pending admin approval. You will be notified once approved.'
    };
    req.session.user = null;
    return res.redirect('/login');
  }

  if (user.status === 'suspended') {
    req.session.flash = {
      type: 'error',
      message: 'Your account has been suspended. Please contact an administrator.'
    };
    req.session.user = null;
    return res.redirect('/login');
  }

  if (user.status === 'rejected') {
    req.session.flash = {
      type: 'error',
      message: 'Your registration was rejected. Please contact an administrator.'
    };
    req.session.user = null;
    return res.redirect('/login');
  }

  next();
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user && req.session.user.status === 'approved') {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireApproved, redirectIfLoggedIn };
