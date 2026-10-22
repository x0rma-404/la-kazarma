const Subject = require('../models/Subject');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Solution = require('../models/Solution');
const User = require('../models/User');

exports.index = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const [subjects, recentMaterials, upcomingAssignments, mySolutions] = await Promise.all([
      Subject.findAll(),
      Material.findRecent(5),
      Assignment.findUpcoming(5),
      Solution.findByUser(userId),
    ]);

    res.render('dashboard/index', {
      title: 'Dashboard',
      currentPage: 'dashboard',
      subjects,
      recentMaterials,
      upcomingAssignments,
      mySolutions,
      stats: {
        subjects: subjects.length,
        materials: await Material.count(),
        assignments: await Assignment.count(),
        members: await User.count(),
      },
    });
  } catch (err) {
    next(err);
  }
};
