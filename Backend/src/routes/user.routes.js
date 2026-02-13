import express from 'express';
import { getTrainers } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get all trainers (admin only)
router.get('/trainers', authenticate, authorize('admin'), getTrainers);

export default router;
