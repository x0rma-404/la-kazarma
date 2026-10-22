'use strict';

const express = require('express');
const router = express.Router();
const profile = require('../controllers/profileController');
const { requireAuth, requireApproved } = require('../middleware/auth');

router.get('/',                  requireAuth, requireApproved, profile.showSettings);
router.post('/password',         requireAuth, requireApproved, profile.changePassword);

module.exports = router;

