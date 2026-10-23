const User = require('../models/User');
const InvitationCode = require('../models/InvitationCode');

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Sign Up', currentPage: 'register' });
};

exports.postRegister = async (req, res) => {
  const { full_name, username, student_code, email, password, confirm_password, invitation_code } = req.body;
  try {
    if (!full_name || !email || !password || !invitation_code || !username) {
      req.flash('error', 'All fields including invitation code are required.');
      return res.redirect('/register');
    }
    if (password !== confirm_password) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/register');
    }
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/register');
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/register');
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      req.flash('error', 'This username is already taken.');
      return res.redirect('/register');
    }

    const code = await InvitationCode.findByCode(invitation_code);
    if (!code) {
      req.flash('error', 'Invalid invitation code.');
      return res.redirect('/register');
    }
    if (code.used) {
      req.flash('error', 'This invitation code has already been used.');
      return res.redirect('/register');
    }

    const user = await User.create({ name: full_name, email, password, role: 'student', username, student_code });
    await InvitationCode.markUsed(invitation_code, user.id);

    req.session.user = user;
    req.flash('success', `Welcome to La Kazarma, ${user.name}!`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/register');
  }
};

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Sign In', currentPage: 'login' });
};

exports.postLogin = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    if (!identifier || !password) {
      req.flash('error', 'Username/email and password are required.');
      return res.redirect('/login');
    }

    const user = await User.findByIdentifier(identifier);
    if (!user) {
      req.flash('error', 'Invalid username/email or password.');
      return res.redirect('/login');
    }

    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Invalid username/email or password.');
      return res.redirect('/login');
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      student_code: user.student_code,
      avatar_url: user.avatar_url,
    };
    req.session.user = safeUser;
    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/login');
  });
};

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password', currentPage: 'forgot' });
};

exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    req.flash('success', 'If an account exists for that email, a reset link has been sent.');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/forgot-password');
  }
};

exports.getResetPassword = (req, res) => {
  res.render('auth/reset-password', { title: 'Reset Password', currentPage: 'reset' });
};

exports.postResetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/reset-password');
    }
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/reset-password');
    }
    req.flash('success', 'Your password has been reset. Please sign in.');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/reset-password');
  }
};
