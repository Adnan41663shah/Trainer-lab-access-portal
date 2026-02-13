import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { hashPassword } from './password.js';

/**
 * Generate access token
 * @param {Object} payload - Token payload {id, role}
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry
  });
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload {id}
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry
  });
};

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verify refresh token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Hash a refresh token for storage
 * @param {string} token - Refresh token
 * @returns {Promise<string>} Hashed token
 */
export const hashRefreshToken = async (token) => {
  return await hashPassword(token);
};

/**
 * Set access token cookie
 * @param {Object} res - Express response object
 * @param {string} token - Access token
 */
export const setAccessTokenCookie = (res, token) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    path: '/'
  });
};

/**
 * Set refresh token cookie
 * @param {Object} res - Express response object
 * @param {string} token - Refresh token
 */
export const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh'
  });
};

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
};
