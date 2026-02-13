import { z } from 'zod';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Register schema
export const registerSchema = z.object({
  fullName: z.string()
    .min(3, 'Full name must be at least 3 characters')
    .max(60, 'Full name must not exceed 60 characters')
    .trim(),
  
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(passwordRegex, 'Password must include uppercase, lowercase, number, and special character'),
  
  role: z.enum(['trainer', 'admin'], {
    errorMap: () => ({ message: 'Role must be either trainer or admin' })
  }),
  
  adminInviteCode: z.string().optional()
});

// Login schema
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(1, 'Password is required')
});

/**
 * Validate data against a schema
 * @param {z.ZodSchema} schema - Zod schema
 * @param {Object} data - Data to validate
 * @returns {Object} { success: boolean, data?: Object, errors?: Object }
 */
export const validate = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = {};
      error.errors.forEach(err => {
        const field = err.path[0];
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      return { success: false, errors: fieldErrors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
