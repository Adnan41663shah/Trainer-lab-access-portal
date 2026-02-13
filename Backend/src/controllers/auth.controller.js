import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies
} from '../utils/token.js';
import { validate, registerSchema, loginSchema } from '../utils/validation.js';
import { config } from '../config/env.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    // Validate input
    const validation = validate(registerSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation failed',
        fieldErrors: validation.errors
      });
    }
    
    const { fullName, email, password, role, adminInviteCode } = validation.data;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
        fieldErrors: {
          email: 'This email is already registered'
        }
      });
    }
    
    // Role escalation prevention
    let userRole = role;
    if (role === 'admin') {
      if (!adminInviteCode || adminInviteCode !== config.adminInviteCode) {
        return res.status(403).json({
          message: 'Invalid admin invite code',
          fieldErrors: {
            adminInviteCode: 'Invalid or missing admin invite code. Registering as trainer instead.'
          }
        });
      }
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: userRole
    });
    
    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    // Hash and store refresh token
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();
    
    // Set cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    
    // Return user profile
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    // Validate input
    const validation = validate(loginSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation failed',
        fieldErrors: validation.errors
      });
    }
    
    const { email, password } = validation.data;
    
    // Find user with password hash
    const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHash');
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    // Hash and store refresh token
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();
    
    // Set cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    
    // Return user profile
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid refresh token'
      });
    }
    
    // Verify stored refresh token hash
    const isRefreshTokenValid = await comparePassword(refreshToken, user.refreshTokenHash);
    
    if (!isRefreshTokenValid) {
      return res.status(401).json({
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user._id });
    
    // Hash and store new refresh token
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);
    user.refreshTokenHash = newRefreshTokenHash;
    await user.save();
    
    // Set new cookies
    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);
    
    res.json({
      message: 'Token refreshed successfully'
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Refresh token expired. Please login again.'
      });
    }
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        
        // Invalidate refresh token in database
        await User.findByIdAndUpdate(decoded.id, {
          $unset: { refreshTokenHash: 1 }
        });
      } catch (error) {
        // Token might be expired or invalid, continue with logout
      }
    }
    
    // Clear cookies
    clearAuthCookies(res);
    
    res.json({
      message: 'Logout successful'
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    next(error);
  }
};
