const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const auth = require('../middleware/auth');

router.get('/', materialController.index);
router.get('/upload', materialController.getUpload);
router.post('/upload', materialController.postUpload);
router.get('/:id', materialController.show);
router.post('/:id/delete', auth.requireRole('admin'), materialController.delete);

module.exports = router;
