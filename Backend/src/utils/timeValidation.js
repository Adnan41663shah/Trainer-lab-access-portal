import { Batch } from '../models/Batch.js';

/**
 * Combine date and time strings into a UTC timestamp
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:mm format
 * @returns {Date} UTC timestamp
 */
export const combineDateTime = (date, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create date object in IST (Indian Standard Time)
  // We construct an ISO string with +05:30 offset
  // Format: YYYY-MM-DDTHH:mm:00.000+05:30
  const dateTimeString = `${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000+05:30`;
  
  return new Date(dateTimeString);
};

/**
 * Validate that start time is in the future
 * @param {Date} startAt - Start timestamp
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateFutureTime = (startAt) => {
  const now = new Date();
  if (startAt <= now) {
    return {
      valid: false,
      error: 'Batch start time must be in the future'
    };
  }
  return { valid: true };
};

/**
 * Validate that end time is after start time
 * @param {Date} startAt - Start timestamp
 * @param {Date} endAt - End timestamp
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateEndAfterStart = (startAt, endAt) => {
  if (endAt <= startAt) {
    return {
      valid: false,
      error: 'End time must be after start time'
    };
  }
  return { valid: true };
};

/**
 * Validate minimum batch duration (10 minutes)
 * @param {Date} startAt - Start timestamp
 * @param {Date} endAt - End timestamp
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateMinimumDuration = (startAt, endAt) => {
  const MINIMUM_DURATION_MS = 10 * 60 * 1000; // 10 minutes
  const duration = endAt - startAt;
  
  if (duration < MINIMUM_DURATION_MS) {
    return {
      valid: false,
      error: 'Batch duration must be at least 10 minutes'
    };
  }
  return { valid: true };
};

/**
 * Check for overlapping batches for the same trainer
 * @param {string} trainerId - Trainer ID
 * @param {Date} startAt - Start timestamp
 * @param {Date} endAt - End timestamp
 * @param {string} excludeBatchId - Batch ID to exclude (for updates)
 * @returns {Promise<Object>} { hasOverlap: boolean, error?: string }
 */
export const checkBatchOverlap = async (trainerIds, startAt, endAt, excludeBatchId = null) => {
  // Ensure trainerIds is an array
  const ids = Array.isArray(trainerIds) ? trainerIds : [trainerIds];

  const query = {
    trainerIds: { $in: ids }, // Check if any of the batch's trainers match any of the provided IDs
    isCancelled: false,
    $or: [
      // New batch starts during existing batch
      { startAt: { $lte: startAt }, endAt: { $gt: startAt } },
      // New batch ends during existing batch
      { startAt: { $lt: endAt }, endAt: { $gte: endAt } },
      // New batch completely contains existing batch
      { startAt: { $gte: startAt }, endAt: { $lte: endAt } }
    ]
  };
  
  // Exclude current batch when updating
  if (excludeBatchId) {
    query._id = { $ne: excludeBatchId };
  }
  
  const overlappingBatch = await Batch.findOne(query).populate('trainerIds', 'fullName');
  
  if (overlappingBatch) {
    // Find which trainer has the overlap
    const overlappingTrainerIds = overlappingBatch.trainerIds.map(t => t._id.toString());
    const conflictingTrainerIds = ids.filter(id => overlappingTrainerIds.includes(id.toString()));
    
    // Check if we populated trainer info to give a better error message
    // Note: overlappingBatch.trainerIds might be array of objects (if populated) or IDs
    
    let conflictingNames = 'One of the selected trainers';
    if (overlappingBatch.trainerIds && overlappingBatch.trainerIds.length > 0 && overlappingBatch.trainerIds[0].fullName) {
       const conflictingTrainers = overlappingBatch.trainerIds.filter(t => ids.includes(t._id.toString()));
       if (conflictingTrainers.length > 0) {
         conflictingNames = conflictingTrainers.map(t => t.fullName).join(', ');
       }
    }

    return {
      hasOverlap: true,
      error: `${conflictingNames} already has a batch scheduled during this time`
    };
  }
  
  return { hasOverlap: false };
};

/**
 * Validate all time-related rules for a batch
 * @param {Object} params - Validation parameters
 * @returns {Promise<Object>} { valid: boolean, errors?: Object }
 */
export const validateBatchTime = async ({ date, startTime, endTime, trainerIds, excludeBatchId = null, skipFutureCheck = false }) => {
  const errors = {};
  
  // Combine date and time
  const startAt = combineDateTime(date, startTime);
  const endAt = combineDateTime(date, endTime);
  
  // Validate future time (skip for updates to existing batches)
  if (!skipFutureCheck) {
    const futureCheck = validateFutureTime(startAt);
    if (!futureCheck.valid) {
      errors.startTime = futureCheck.error;
    }
  }
  
  // Validate end after start
  const endAfterStartCheck = validateEndAfterStart(startAt, endAt);
  if (!endAfterStartCheck.valid) {
    errors.endTime = endAfterStartCheck.error;
  }
  
  // Validate minimum duration
  const durationCheck = validateMinimumDuration(startAt, endAt);
  if (!durationCheck.valid) {
    errors.endTime = durationCheck.error;
  }
  
  // If there are already errors, don't check overlap
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  
  // Check for overlapping batches
  const overlapCheck = await checkBatchOverlap(trainerIds, startAt, endAt, excludeBatchId);
  if (overlapCheck.hasOverlap) {
    errors.general = overlapCheck.error;
    return { valid: false, errors };
  }
  
  return { valid: true, startAt, endAt };
};

/**
 * Get batch status based on current time
 * @param {Object} batch - Batch object
 * @returns {string} Status: 'Upcoming', 'Live', 'Expired', 'Cancelled'
 */
export const getBatchStatus = (batch) => {
  if (batch.isCancelled) return 'Cancelled';
  
  const now = new Date();
  if (now < batch.startAt) return 'Upcoming';
  if (now >= batch.startAt && now <= batch.endAt) return 'Live';
  if (now > batch.endAt) return 'Expired';
  
  return 'Unknown';
};

/**
 * Check if batch is expiring soon (within 10 minutes)
 * @param {Object} batch - Batch object
 * @returns {boolean}
 */
export const isExpiringSoon = (batch) => {
  if (batch.isCancelled || getBatchStatus(batch) !== 'Live') {
    return false;
  }
  
  const now = new Date();
  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
  
  return batch.endAt <= tenMinutesFromNow;
};
