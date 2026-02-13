import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller.js';
import { authenticate, checkAuthStatus } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  message: {
    message: 'Too many login attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Rate limiter for register endpoint
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: {
    message: 'Too many registration attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', checkAuthStatus, getMe);

export default router;
