'use strict';

const express = require('express');
const router = express.Router();
const profile = require('../controllers/profileController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/',                                requireAuth, requireAdmin, profile.showAdmin);
router.post('/users/:id/approve',              requireAuth, requireAdmin, profile.approveUser);
router.post('/users/:id/reject',               requireAuth, requireAdmin, profile.rejectUser);
router.post('/users/:id/suspend',              requireAuth, requireAdmin, profile.suspendUser);
router.post('/users/:id/reactivate',           requireAuth, requireAdmin, profile.reactivateUser);
router.post('/invitation-codes',               requireAuth, requireAdmin, profile.createInvitationCode);
router.post('/invitation-codes/:id/deactivate',requireAuth, requireAdmin, profile.deactivateInvitationCode);
router.post('/settings',                       requireAuth, requireAdmin, profile.updateSettings);

module.exports = router;

