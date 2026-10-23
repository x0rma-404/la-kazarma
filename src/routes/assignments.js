const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const auth = require('../middleware/auth');

router.get('/', assignmentController.index);
router.get('/new', assignmentController.getNew);
router.post('/new', assignmentController.postNew);
router.get('/:id', assignmentController.show);
router.post('/:id/delete', auth.requireRole('admin'), assignmentController.delete);
router.post('/:id/solutions', assignmentController.submitSolution);
router.post('/:id/grade', auth.requireRole('admin'), assignmentController.gradeSolution);
router.get('/solutions/:id/download', assignmentController.downloadSolution);

module.exports = router;
