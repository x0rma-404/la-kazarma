const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/materialController');
const Bookmark = require('../models/Bookmark');

router.get('/', async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.findByUser(req.session.user.id);
    res.render('bookmarks/index', {
      title: 'Bookmarks',
      currentPage: 'bookmarks',
      bookmarks,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await Bookmark.delete(req.params.id);
    req.flash('success', 'Bookmark removed.');
    res.redirect('back');
  } catch (err) {
    req.flash('error', 'Failed to remove bookmark.');
    res.redirect('back');
  }
});

module.exports = router;
