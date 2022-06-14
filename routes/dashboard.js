const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

router.get('/public/dashboard', dashboardController.loginForm);

router.post('/public/loginRequest', dashboardController.loginRequest);

router.post('/public/logoutRequest', dashboardController.logoutRequest);

exports.routes = router