import { z } from 'zod';

// Create batch schema
export const createBatchSchema = z.object({
  batchName: z.string()
    .min(3, 'Batch name must be at least 3 characters')
    .max(80, 'Batch name must not exceed 80 characters')
    .trim(),
  
  trainerIds: z.array(z.string().min(1))
    .min(1, 'At least one trainer is required'),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  
  // Lab credentials (mandatory)
  labCredentials: z.object({
    loginUrl: z.string().url('Login URL must be a valid URL'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
  })
});

// Update batch schema
export const updateBatchSchema = z.object({
  batchName: z.string()
    .min(3, 'Batch name must be at least 3 characters')
    .max(80, 'Batch name must not exceed 80 characters')
    .trim()
    .optional(),
  
  trainerIds: z.array(z.string().min(1))
    .min(1, 'At least one trainer is required')
    .optional(),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format')
    .optional(),
  
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format')
    .optional(),
  
  // Lab credentials (optional, but must be complete if provided)
  labCredentials: z.object({
    loginUrl: z.string().url('Login URL must be a valid URL'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
  }).optional()
});

/**
 * Validate data against a schema
 */
export const validateBatch = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = {};
      error.errors.forEach(err => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      return { success: false, errors: fieldErrors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
