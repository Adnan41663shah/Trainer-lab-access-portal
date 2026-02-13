import express from 'express';
import {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  cancelBatch,
  getLabCredentials
} from '../controllers/batch.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All batch routes require authentication
router.use(authenticate);

// Get all batches (admin sees all, trainer sees only assigned)
router.get('/', getBatches);

// Get single batch
router.get('/:id', getBatchById);

// Get lab credentials (trainer only, only when LIVE)
router.get('/:id/credentials', getLabCredentials);

// Admin-only routes
router.post('/', authorize('admin'), createBatch);
router.put('/:id', authorize('admin'), updateBatch);
router.delete('/:id', authorize('admin'), deleteBatch);
router.patch('/:id/cancel', authorize('admin'), cancelBatch);

export default router;
