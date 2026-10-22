'use strict';

const express = require('express');
const router = express.Router();
const profile = require('../controllers/profileController');
const { requireAuth, requireApproved, requireAdmin } = require('../middleware/auth');

// Profile
router.get('/',        requireAuth, requireApproved, profile.show);
router.post('/update', requireAuth, requireApproved, profile.update);

// Settings
router.get('/settings',         requireAuth, requireApproved, profile.showSettings);
router.post('/settings/password', requireAuth, requireApproved, profile.changePassword);

// Admin panel
router.get('/admin',                        requireAuth, requireAdmin, profile.showAdmin);
router.post('/admin/users/:id/approve',     requireAuth, requireAdmin, profile.approveUser);
router.post('/admin/users/:id/reject',      requireAuth, requireAdmin, profile.rejectUser);
router.post('/admin/users/:id/suspend',     requireAuth, requireAdmin, profile.suspendUser);
router.post('/admin/users/:id/reactivate',  requireAuth, requireAdmin, profile.reactivateUser);
router.post('/admin/invitation-codes',      requireAuth, requireAdmin, profile.createInvitationCode);
router.post('/admin/invitation-codes/:id/deactivate', requireAuth, requireAdmin, profile.deactivateInvitationCode);

module.exports = router;
