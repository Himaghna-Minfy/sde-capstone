const { validationResult } = require('express-validator')
const authService = require('../services/authService')

const authController = {
  async register(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password, displayName } = req.body
      const result = await authService.register(email, password, displayName)
      
      res.status(201).json(result)
    } catch (error) {
      console.error('Registration error:', error)
      res.status(400).json({ message: error.message })
    }
  },

  async login(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body
      const result = await authService.login(email, password)
      
      res.json(result)
    } catch (error) {
      console.error('Login error:', error)
      res.status(401).json({ message: error.message })
    }
  },

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ message: 'No token provided' })
      }

      const user = await authService.verifyToken(token)
      res.json(user)
    } catch (error) {
      console.error('Token verification error:', error)
      res.status(401).json({ message: 'Invalid token' })
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' })
      }

      const result = await authService.refreshToken(refreshToken)
      res.json(result)
    } catch (error) {
      console.error('Token refresh error:', error)
      res.status(401).json({ message: error.message })
    }
  }
}

module.exports = authController
