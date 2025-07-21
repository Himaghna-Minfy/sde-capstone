const { body, validationResult } = require('express-validator');
const JWTUtils = require('../utils/jwt');
const UserService = require('../services/UserService');
const { getAuth } = require('../config/firebase');

class AuthController {
  static registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
  ];

  static loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ];

  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { email, name, firebaseUid } = req.body;

      // Check if user already exists
      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
      }

      // Create user
      const user = await UserService.createUser({
        email,
        name,
        firebaseUid: firebaseUid,
        role: 'editor'
      });

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid
      };

      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(tokenPayload);

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON ? user.toJSON() : user,
        tokens: { accessToken, refreshToken }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed', message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { email, name, firebaseUid } = req.body;

      let user = await UserService.getUserByEmail(email);
      if (!user) {
        // Create user if doesn't exist (for social login)
        user = await UserService.createUser({
          email,
          name: name || email.split('@')[0],
          firebaseUid: firebaseUid,
          role: 'editor'
        });
      }

      // Update last seen
      await UserService.updateLastSeen(user.id);

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid
      };

      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(tokenPayload);

      res.json({
        message: 'Login successful',
        user: user.toJSON ? user.toJSON() : user,
        tokens: { accessToken, refreshToken }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed', message: error.message });
    }
  }

  static async firebaseLogin(req, res) {
    try {
      const { firebaseIdToken, email, name } = req.body;

      if (!firebaseIdToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          message: 'No Firebase ID token provided'
        });
      }

      // Verify Firebase ID token
      const auth = getAuth();
      let decodedToken;
      
      try {
        decodedToken = await auth.verifyIdToken(firebaseIdToken);
      } catch (firebaseError) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          message: firebaseError.message
        });
      }

      // Get or create user
      let user = await UserService.getUserByFirebaseUid(decodedToken.uid);
      
      if (!user) {
        // Create new user
        user = await UserService.createUser({
          email: email || decodedToken.email,
          name: name || decodedToken.name || decodedToken.email?.split('@')[0],
          firebaseUid: decodedToken.uid,
          role: 'editor'
        });
      } else {
        // Update last seen
        await UserService.updateLastSeen(user.id);
      }

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid
      };

      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(tokenPayload);

      res.json({
        message: 'Firebase login successful',
        user: user.toJSON ? user.toJSON() : user,
        tokens: { accessToken, refreshToken }
      });

    } catch (error) {
      console.error('Firebase login error:', error);
      res.status(500).json({ error: 'Firebase login failed', message: error.message });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Refresh token required',
          message: 'No refresh token provided'
        });
      }

      const payload = JWTUtils.verifyRefreshToken(refreshToken);
      const user = await UserService.getUserById(payload.userId);

      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: 'Invalid refresh token'
        });
      }

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid
      };

      const { accessToken, refreshToken: newRefreshToken } = JWTUtils.generateTokenPair(tokenPayload);

      res.json({
        message: 'Token refreshed successfully',
        tokens: { accessToken, refreshToken: newRefreshToken }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        message: error.message || 'Invalid refresh token'
      });
    }
  }

  static async getProfile(req, res) {
    try {
      res.json({
        message: 'Profile retrieved successfully',
        user: req.user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to get profile',
        message: error.message || 'Internal server error'
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { name, preferences } = req.body;
      const userId = req.user.id;

      const updateData = {};
      if (name) updateData.name = name;
      if (preferences) updateData.preferences = preferences;

      const updatedUser = await UserService.updateUser(userId, updateData);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser.toJSON ? updatedUser.toJSON() : updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;
