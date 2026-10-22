'use strict';

const express = require('express');
const router = express.Router();
const materials = require('../controllers/materialController');
const { requireAuth, requireApproved } = require('../middleware/auth');

router.get('/', requireAuth, requireApproved, materials.showBookmarks);

module.exports = router;

