// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')

router.post('/login', checkRequiredFields(['email', 'password']), authController.login);

router.post('/login-admin', checkRequiredFields(['email', 'password']), authController.loginAdmin);

router.post('/login-superadmin', checkRequiredFields(['email', 'password']), authController.loginSuperAdmin);

router.post('/login-participant', checkRequiredFields(['matricule']), authController.loginApprenant);

module.exports = router;
