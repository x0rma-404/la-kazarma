'use strict';

const express = require('express');
const router = express.Router();
const materials = require('../controllers/materialController');
const { requireAuth, requireApproved } = require('../middleware/auth');
const { materialUpload } = require('../config/upload');

// Multer error handling wrapper
function uploadMiddleware(req, res, next) {
  const uploader = materialUpload.single('file');
  uploader(req, res, (err) => {
    if (err) {
      req.session.flash = { type: 'error', message: err.message };
      return res.redirect('/materials/upload');
    }
    next();
  });
}

router.get('/',               requireAuth, requireApproved, materials.index);
router.get('/upload',         requireAuth, requireApproved, materials.showUpload);
router.post('/upload',        requireAuth, requireApproved, uploadMiddleware, materials.upload);
router.get('/:id',            requireAuth, requireApproved, materials.show);
router.get('/:id/download',   requireAuth, requireApproved, materials.download);
router.get('/:id/preview',    requireAuth, requireApproved, materials.preview);
router.post('/:id/update',    requireAuth, requireApproved, materials.update);
router.post('/:id/delete',    requireAuth, requireApproved, materials.deleteMaterial);
router.post('/:id/bookmark',  requireAuth, requireApproved, materials.toggleBookmark);

module.exports = router;

