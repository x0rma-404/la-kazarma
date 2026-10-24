function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please sign in to continue.');
    return res.redirect('/login');
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error', 'Please sign in to continue.');
      return res.redirect('/login');
    }
    if (req.session.user.role !== role) {
      req.flash('error', 'You do not have permission to access that page.');
      return res.redirect('/dashboard');
    }
    next();
  };
}

function optionalAuth(req, res, next) {
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
