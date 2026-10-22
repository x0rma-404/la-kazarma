'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { redirectIfLoggedIn } = require('../middleware/auth');

router.get('/login',           redirectIfLoggedIn, auth.showLogin);
router.post('/login',          redirectIfLoggedIn, auth.login);
router.get('/register',        redirectIfLoggedIn, auth.showRegister);
router.post('/register',       redirectIfLoggedIn, auth.register);
router.get('/forgot-password', redirectIfLoggedIn, auth.showForgotPassword);
router.post('/forgot-password',redirectIfLoggedIn, auth.forgotPassword);
router.get('/reset-password',  auth.showResetPassword);
router.post('/reset-password', auth.resetPassword);
router.post('/logout',         auth.logout);

module.exports = router;
