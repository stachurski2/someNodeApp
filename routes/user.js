
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/registerUser', userController.registerUser); // ok

router.post('/loginUser', userController.login); //ok 

router.get('/userList', userController.userList); // ok

router.post('/resetPassword', userController.remindPassword); //ok

router.delete('/deleteUser', userController.deleteUser); // ok 

router.post('/saveNewPassword', userController.saveNewPassword) //ok

router.post('/changePassword', userController.changePassword) //ok

router.post('/requestDemo', userController.requestDemo); //ok

router.post('/requestAddSensor', userController.addSensor);

router.post('/requestDeleteSensor', userController.deleteSensor);

exports.routes = router