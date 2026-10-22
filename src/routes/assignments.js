const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const auth = require('../middleware/auth');

router.get('/', assignmentController.index);
router.get('/new', auth.requireRole('admin'), assignmentController.getNew);
router.post('/new', auth.requireRole('admin'), assignmentController.postNew);
router.get('/:id', assignmentController.show);
router.post('/:id/delete', auth.requireRole('admin'), assignmentController.delete);
router.post('/:id/solution', assignmentController.submitSolution);
router.post('/:id/grade', auth.requireRole('admin'), assignmentController.gradeSolution);

module.exports = router;
