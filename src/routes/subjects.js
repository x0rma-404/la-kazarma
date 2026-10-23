const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const auth = require('../middleware/auth');

router.get('/', subjectController.index);
router.get('/:id', subjectController.show);
router.post('/', auth.requireRole('admin'), subjectController.create);
router.post('/:id', auth.requireRole('admin'), subjectController.update);
router.post('/:id/delete', auth.requireRole('admin'), subjectController.delete);
router.post('/:id/topics', subjectController.createTopic);
router.post('/:id/topics/:topicId/delete', subjectController.deleteTopic);
router.post('/:id/announcements', auth.requireRole('admin'), subjectController.createAnnouncement);
router.post('/:id/announcements/:announcementId/delete', auth.requireRole('admin'), subjectController.deleteAnnouncement);

module.exports = router;
