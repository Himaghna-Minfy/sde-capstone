const JWTUtils = require('../utils/jwt');

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'No authorization header provided'
        });
      }

      const token = JWTUtils.extractTokenFromHeader(authHeader);
      const payload = JWTUtils.verifyAccessToken(token);
      
      // For demo purposes, create a mock user
      req.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.name || 'Demo User',
        role: payload.role || 'editor',
        avatar: payload.avatar || 'U'
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message || 'Invalid or expired token'
      });
    }
  }

  static authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated'
        });
      }

      if (roles.length === 0) {
        return next();
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required roles: ${roles.join(', ')}. User role: ${req.user.role}`
        });
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;
