require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');

const sessionStore = require('./src/config/sessionStore');
const authMiddleware = require('./src/middleware/auth');
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const subjectRoutes = require('./src/routes/subjects');
const materialRoutes = require('./src/routes/materials');
const assignmentRoutes = require('./src/routes/assignments');
const bookmarkRoutes = require('./src/routes/bookmarks');
const profileRoutes = require('./src/routes/profile');
const settingsRoutes = require('./src/routes/settings');
const adminRoutes = require('./src/routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-key-12345',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPage = '';
  next();
});

app.use('/', authRoutes);
app.use('/dashboard', authMiddleware.requireAuth, dashboardRoutes);
app.use('/subjects', authMiddleware.requireAuth, subjectRoutes);
app.use('/materials', authMiddleware.requireAuth, materialRoutes);
app.use('/assignments', authMiddleware.requireAuth, assignmentRoutes);
app.use('/bookmarks', authMiddleware.requireAuth, bookmarkRoutes);
app.use('/profile', authMiddleware.requireAuth, profileRoutes);
app.use('/settings', authMiddleware.requireAuth, settingsRoutes);
app.use('/admin', authMiddleware.requireAuth, authMiddleware.requireRole('admin'), adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist.',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    statusCode: 500,
    message: 'Something went wrong on our end.',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`La Kazarma running on port ${PORT}`);
});

module.exports = app;
