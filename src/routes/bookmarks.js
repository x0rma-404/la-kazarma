const express = require('express');
const router = express.Router();
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

router.post('/', async (req, res, next) => {
  try {
    const { materialId } = req.body;
    await Bookmark.create({ user_id: req.session.user.id, material_id: materialId });
    req.flash('success', 'Bookmarked.');
    res.redirect('back');
  } catch (err) {
    req.flash('error', 'Failed to bookmark.');
    res.redirect('back');
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
