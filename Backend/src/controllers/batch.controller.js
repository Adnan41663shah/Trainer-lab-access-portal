import { Batch } from '../models/Batch.js';
import { User } from '../models/User.js';
import { validateBatch, createBatchSchema, updateBatchSchema } from '../utils/batchValidation.js';
import { validateBatchTime, getBatchStatus } from '../utils/timeValidation.js';

/**
 * Create a new batch (Admin only)
 * POST /api/batches
 */
export const createBatch = async (req, res, next) => {
  try {
    // Validate input
    const validation = validateBatch(createBatchSchema, req.body);
    
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      return res.status(200).json({
        success: false,
        message: firstError || 'Validation failed',
        fieldErrors: validation.errors
      });
    }
    
    
    const { batchName, trainerIds, date, startTime, endTime, labCredentials } = validation.data;
    
    // Verify trainers exist and have trainer role
    const trainers = await User.find({ _id: { $in: trainerIds } });
    
    if (trainers.length !== trainerIds.length) {
      return res.status(200).json({
        success: false,
        message: 'One or more trainers not found',
        fieldErrors: {
          trainerIds: 'Some selected trainers do not exist'
        }
      });
    }
    
    const invalidTrainers = trainers.filter(t => t.role !== 'trainer');
    if (invalidTrainers.length > 0) {
      return res.status(200).json({
        success: false,
        message: 'Invalid trainer selection',
        fieldErrors: {
          trainerIds: 'One or more selected users are not trainers'
        }
      });
    }
    
    // Validate time rules
    const timeValidation = await validateBatchTime({
      date,
      startTime,
      endTime,
      trainerIds
    });
    
    if (!timeValidation.valid) {
      const firstError = timeValidation.errors.general || Object.values(timeValidation.errors)[0];
      return res.status(200).json({
        success: false,
        message: firstError || 'Validation failed',
        fieldErrors: timeValidation.errors
      });
    }
    
    // Prepare batch data
    const batchData = {
      batchName,
      trainerIds,
      startAt: timeValidation.startAt,
      endAt: timeValidation.endAt,
      createdBy: req.user.id
    };
    
    // Add lab credentials if provided
    if (labCredentials && labCredentials.loginUrl && labCredentials.username && labCredentials.password) {
      batchData.labCredentials = {
        loginUrl: labCredentials.loginUrl,
        username: labCredentials.username,
        password: labCredentials.password
      };
    }
    
    // Create batch
    const batch = await Batch.create(batchData);
    
    // Populate trainer info
    await batch.populate('trainerIds', 'fullName email');
    
    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      batch: {
        id: batch._id,
        batchName: batch.batchName,
        trainers: batch.trainerIds.map(t => ({
          id: t._id,
          name: t.fullName,
          email: t.email
        })),
        startAt: batch.startAt,
        endAt: batch.endAt,
        status: batch.status,
        isCancelled: batch.isCancelled,
        createdAt: batch.createdAt,
        labCredentials: batch.labCredentials
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get all batches (Admin sees all, Trainer sees only assigned)
 * GET /api/batches
 */
export const getBatches = async (req, res, next) => {
  try {
    const query = {};
    
    // If trainer, only show their batches
    if (req.user.role === 'trainer') {
      query.trainerIds = req.user.id;
    }
    
    const batches = await Batch.find(query)
      .populate('trainerIds', 'fullName email')
      .sort({ startAt: 1 });
    
    const batchesWithStatus = batches.map(batch => ({
      id: batch._id,
      batchName: batch.batchName,
      trainers: batch.trainerIds.map(t => ({
        id: t._id,
        name: t.fullName,
        email: t.email
      })),
      startAt: batch.startAt,
      endAt: batch.endAt,
      status: batch.status,
      isCancelled: batch.isCancelled,
      createdAt: batch.createdAt,
      labCredentials: batch.labCredentials
    }));
    
    res.json({
      success: true,
      batches: batchesWithStatus
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get single batch by ID (Admin or assigned trainer only)
 * GET /api/batches/:id
 */
export const getBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findById(id)
      .populate('trainerIds', 'fullName email');
    
    if (!batch) {
      return res.status(404).json({
        message: 'Batch not found'
      });
    }
    
    // If trainer, verify they are assigned to this batch
    if (req.user.role === 'trainer' && !batch.trainerIds.some(t => t._id.toString() === req.user.id)) {
      return res.status(404).json({
        message: 'Batch not found'
      });
    }
    
    res.json({
      success: true,
      batch: {
        id: batch._id,
        batchName: batch.batchName,
        trainers: batch.trainerIds.map(t => ({
          id: t._id,
          name: t.fullName,
          email: t.email
        })),
        startAt: batch.startAt,
        endAt: batch.endAt,
        status: batch.status,
        isCancelled: batch.isCancelled,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        labCredentials: batch.labCredentials
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Update batch (Admin only)
 * PUT /api/batches/:id
 */
export const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find existing batch
    const existingBatch = await Batch.findById(id);
    
    if (!existingBatch) {
      return res.status(404).json({
        message: 'Batch not found'
      });
    }

    // Check if batch is expired
    const now = new Date();
    if (existingBatch.endAt < now) {
      return res.status(200).json({
        success: false,
        message: 'Cannot edit an expired batch',
        fieldErrors: {
          general: 'This batch has ended and cannot be modified.'
        }
      });
    }
    
    // Validate input
    const validation = validateBatch(updateBatchSchema, req.body);
    
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      return res.status(200).json({
        success: false,
        message: firstError || 'Validation failed',
        fieldErrors: validation.errors
      });
    }
    
    
    const { batchName, trainerIds, date, startTime, endTime, labCredentials } = validation.data;
    
    // Prepare update data
    const updateData = {};
    
    if (batchName) {
      updateData.batchName = batchName;
    }
    
    // If trainers are being updated, verify they exist
    if (trainerIds) {
      const trainers = await User.find({ _id: { $in: trainerIds } });
      
      if (trainers.length !== trainerIds.length) {
        return res.status(200).json({
          success: false,
          message: 'One or more trainers not found',
          fieldErrors: {
            trainerIds: 'Some selected trainers do not exist'
          }
        });
      }
      
      const invalidTrainers = trainers.filter(t => t.role !== 'trainer');
      if (invalidTrainers.length > 0) {
        return res.status(200).json({
          success: false,
          message: 'Invalid trainer selection',
          fieldErrors: {
            trainerIds: 'One or more selected users are not trainers'
          }
        });
      }
      updateData.trainerIds = trainerIds;
    }
    
    // Update lab credentials if provided
    if (labCredentials) {
      if (labCredentials.loginUrl && labCredentials.username && labCredentials.password) {
        updateData.labCredentials = {
          loginUrl: labCredentials.loginUrl,
          username: labCredentials.username,
          password: labCredentials.password
        };
      } else if (labCredentials.loginUrl === '' && labCredentials.username === '' && labCredentials.password === '') {
        // Clear credentials if all fields are empty
        updateData.labCredentials = undefined;
      }
    }
    
    
    // If time is being updated, validate
    if (date || startTime || endTime) {
      const finalDate = date || existingBatch.startAt.toISOString().split('T')[0];
      const finalStartTime = startTime || `${existingBatch.startAt.getHours().toString().padStart(2, '0')}:${existingBatch.startAt.getMinutes().toString().padStart(2, '0')}`;
      const finalEndTime = endTime || `${existingBatch.endAt.getHours().toString().padStart(2, '0')}:${existingBatch.endAt.getMinutes().toString().padStart(2, '0')}`;
      const finalTrainerIds = trainerIds || existingBatch.trainerIds.map(id => id.toString());
      
      // Check if batch is currently LIVE
      const now = new Date();
      const isLive = now >= existingBatch.startAt && now <= existingBatch.endAt;
      
      // Prevent changing date/time for LIVE batches
      if (isLive && (date || startTime || endTime)) {
        return res.status(200).json({
          success: false,
          message: 'Cannot modify date or time for a LIVE batch',
          fieldErrors: {
            general: 'You cannot change the schedule of a batch that is currently live. Please wait until it ends.'
          }
        });
      }
      
      const timeValidation = await validateBatchTime({
        date: finalDate,
        startTime: finalStartTime,
        endTime: finalEndTime,
        trainerIds: finalTrainerIds,
        excludeBatchId: id,
        skipFutureCheck: true // Skip future check for updates
      });
      
      if (!timeValidation.valid) {
        const firstError = timeValidation.errors.general || Object.values(timeValidation.errors)[0];
        return res.status(200).json({
          success: false,
          message: firstError || 'Validation failed',
          fieldErrors: timeValidation.errors
        });
      }
      
      updateData.startAt = timeValidation.startAt;
      updateData.endAt = timeValidation.endAt;
    }
    
    // Update batch
    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('trainerIds', 'fullName email');
    
    res.json({
      success: true,
      message: 'Batch updated successfully',
      batch: {
        id: updatedBatch._id,
        batchName: updatedBatch.batchName,
        trainers: updatedBatch.trainerIds.map(t => ({
          id: t._id,
          name: t.fullName,
          email: t.email
        })),
        startAt: updatedBatch.startAt,
        endAt: updatedBatch.endAt,
        status: updatedBatch.status,
        isCancelled: updatedBatch.isCancelled,
        updatedAt: updatedBatch.updatedAt,
        labCredentials: updatedBatch.labCredentials
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Delete batch (Admin only)
 * DELETE /api/batches/:id
 */
export const deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findByIdAndDelete(id);
    
    if (!batch) {
      return res.status(404).json({
        message: 'Batch not found'
      });
    }
    
    res.json({
      message: 'Batch deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel batch (Admin only)
 * PATCH /api/batches/:id/cancel
 */
export const cancelBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findByIdAndUpdate(
      id,
      { isCancelled: true },
      { new: true }
    ).populate('trainerIds', 'fullName email');
    
    if (!batch) {
      return res.status(404).json({
        message: 'Batch not found'
      });
    }
    
    res.json({
      message: 'Batch cancelled successfully',
      batch: {
        id: batch._id,
        batchName: batch.batchName,
        trainers: batch.trainerIds.map(t => ({
          id: t._id,
          name: t.fullName,
          email: t.email
        })),
        startAt: batch.startAt,
        endAt: batch.endAt,
        status: batch.status,
        isCancelled: batch.isCancelled
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get lab credentials for a batch (Trainer only, only when LIVE)
 * GET /api/batches/:id/credentials
 */
export const getLabCredentials = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findById(id);
    
    if (!batch) {
      return res.status(404).json({
        message: 'Batch not found'
      });
    }
    
    // Verify trainer is assigned to this batch
    if (req.user.role === 'trainer' && !batch.trainerIds.some(id => id.toString() === req.user.id)) {
      return res.status(403).json({
        message: 'Access denied. You are not assigned to this batch.'
      });
    }
    
    // Check if batch is cancelled
    if (batch.isCancelled) {
      return res.status(403).json({
        message: 'This batch has been cancelled.'
      });
    }
    
    // CRITICAL: Re-compute batch status on server (never trust frontend)
    const now = new Date();
    const isLive = now >= batch.startAt && now <= batch.endAt;
    
    if (!isLive) {
      const isUpcoming = now < batch.startAt;
      const isExpired = now > batch.endAt;
      
      if (isUpcoming) {
        return res.status(403).json({
          message: 'Lab access is not available yet. Please wait until the batch starts.'
        });
      }
      
      if (isExpired) {
        return res.status(403).json({
          message: 'Lab access has expired. The batch has ended.'
        });
      }
    }
    
    // Check if credentials exist
    if (!batch.labCredentials || !batch.labCredentials.loginUrl) {
      return res.status(200).json({
        hasCredentials: false,
        message: 'No lab credentials configured for this batch.'
      });
    }
    
    // Return credentials only if batch is LIVE
    res.json({
      hasCredentials: true,
      credentials: {
        loginUrl: batch.labCredentials.loginUrl,
        username: batch.labCredentials.username,
        password: batch.labCredentials.password
      },
      batchName: batch.batchName,
      endAt: batch.endAt
    });
    
  } catch (error) {
    next(error);
  }
};
