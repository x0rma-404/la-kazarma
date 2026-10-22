'use strict';

const User = require('../models/User');
const Subject = require('../models/Subject');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Bookmark = require('../models/Bookmark');

function index(req, res) {
  const sessionUser = req.session.user;
  let pendingCount = 0;
  let totalUsers = 0;

  if (sessionUser.role === 'admin') {
    pendingCount = User.countByStatus('pending');
    totalUsers   = User.countAll();
  }

  const userUploadsCount = Material.countByUploader(sessionUser.id);
  const totalAssignmentsCount = Assignment.countAll();
  const userBookmarksCount = Bookmark.countByUser(sessionUser.id);
  const totalSubjectsCount = Subject.countAll(false);

  // Recent materials for activity feed
  const recentMaterials = Material.findAll({ limit: 4 });
  const recentAssignments = Assignment.findAll({ limit: 4, status: 'active' });

  res.render('dashboard/index', {
    title: 'Dashboard – La Kazarma',
    pendingCount,
    totalUsers,
    userUploadsCount,
    totalAssignmentsCount,
    userBookmarksCount,
    totalSubjectsCount,
    recentMaterials,
    recentAssignments
  });
}

module.exports = { index };
