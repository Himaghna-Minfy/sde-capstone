const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', AuthController.registerValidation, AuthController.register);
router.post('/login', AuthController.loginValidation, AuthController.login);
router.post('/firebase-login', AuthController.firebaseLogin);
router.post('/refresh', AuthController.refreshToken);

// Protected routes
router.use(AuthMiddleware.authenticate);
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);

module.exports = router;
