const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.index);
router.post('/', profileController.update);
router.post('/password', profileController.changePassword);

module.exports = router;
