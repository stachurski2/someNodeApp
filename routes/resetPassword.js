const express = require('express');
const router = express.Router();

const resetPasswordController = require('../controllers/resetPasswordController');
const { routes } = require('./sensors');

router.get('/resetPasswordForm', resetPasswordController.getResetPasswordForm);

exports.routes = router
