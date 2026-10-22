'use strict';

const express = require('express');
const router = express.Router();
const assignments = require('../controllers/assignmentController');
const { requireAuth, requireApproved } = require('../middleware/auth');
const { assignmentUpload, solutionUpload } = require('../config/upload');

function assignmentUploadMiddleware(req, res, next) {
  const uploader = assignmentUpload.single('file');
  uploader(req, res, (err) => {
    if (err) {
      req.session.flash = { type: 'error', message: err.message };
      return res.redirect('/assignments/new');
    }
    next();
  });
}

function solutionUploadMiddleware(req, res, next) {
  const uploader = solutionUpload.single('file');
  uploader(req, res, (err) => {
    if (err) {
      req.session.flash = { type: 'error', message: err.message };
      return res.redirect(`/assignments/${req.params.id}`);
    }
    next();
  });
}

router.get('/',                                  requireAuth, requireApproved, assignments.index);
router.get('/new',                              requireAuth, requireApproved, assignments.showCreate);
router.post('/new',                             requireAuth, requireApproved, assignmentUploadMiddleware, assignments.create);
router.get('/:id',                              requireAuth, requireApproved, assignments.show);
router.get('/:id/download',                     requireAuth, requireApproved, assignments.downloadOriginal);
router.post('/:id/solutions',                   requireAuth, requireApproved, solutionUploadMiddleware, assignments.submitSolution);
router.get('/solutions/:solutionId/download',   requireAuth, requireApproved, assignments.downloadSolution);
router.post('/:id/solutions/:solutionId/delete',requireAuth, requireApproved, assignments.deleteSolution);
router.post('/:id/delete',                      requireAuth, requireApproved, assignments.deleteAssignment);

module.exports = router;

