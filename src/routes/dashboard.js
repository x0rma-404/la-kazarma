'use strict';

const express = require('express');
const router = express.Router();
const dashboard = require('../controllers/dashboardController');
const { requireAuth, requireApproved } = require('../middleware/auth');

router.get('/', requireAuth, requireApproved, dashboard.index);

module.exports = router;
