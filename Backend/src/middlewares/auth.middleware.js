import { verifyAccessToken } from '../utils/token.js';

/**
 * Middleware to verify JWT access token from cookie
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    
    if (!token) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }
    
    const decoded = verifyAccessToken(token);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    
    return res.status(500).json({
      message: 'Authentication failed'
    });
  }

};

/**
 * Middleware to check auth status without returning 401
 * Used for initial load to avoid console errors
 */
export const checkAuthStatus = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    
    if (!token) {
      return res.status(200).json({
        user: null,
        authenticated: false
      });
    }
    
    const decoded = verifyAccessToken(token);
    
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    // Return 200 with null user instead of 401
    return res.status(200).json({
      user: null,
      authenticated: false,
      code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};
