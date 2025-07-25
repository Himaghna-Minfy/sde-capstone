const express = require('express')
const { body } = require('express-validator')
const authController = require('../controllers/authController')

const router = express.Router()

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').notEmpty().trim()
], authController.register)

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login)

// Verify token
router.get('/verify', authController.verifyToken)

// Refresh token
router.post('/refresh', authController.refreshToken)

module.exports = router
