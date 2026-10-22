'use strict';

const express = require('express');
const router = express.Router();
const subjects = require('../controllers/subjectController');
const { requireAuth, requireApproved, requireAdmin } = require('../middleware/auth');

// Students & Admins
router.get('/',                      requireAuth, requireApproved, subjects.index);
router.get('/:id/topics-json',       requireAuth, requireApproved, subjects.getTopicsJson);
router.get('/:id',                   requireAuth, requireApproved, subjects.show);

// Admin-only management
router.post('/',                     requireAuth, requireAdmin, subjects.create);
router.post('/:id/update',           requireAuth, requireAdmin, subjects.update);
router.post('/:id/archive',          requireAuth, requireAdmin, subjects.toggleArchive);
router.post('/:id/topics',           requireAuth, requireAdmin, subjects.addTopic);
router.post('/:id/topics/:topicId/delete', requireAuth, requireAdmin, subjects.deleteTopic);
router.post('/:id/announcements',    requireAuth, requireAdmin, subjects.addAnnouncement);

module.exports = router;

