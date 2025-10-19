import { z } from 'zod';

/**
 * Email validator schema
 */
export const emailSchema = z.string().trim().email({ message: 'Invalid email address' });

/**
 * Password validator schema
 */
export const passwordSchema = z
  .string()
  .trim()
  .min(12, { message: 'Password must be at least 12 characters' })
  .refine((val) => /\d/.test(val), {
    message: 'Password must contain at least 1 digit',
  })
  .refine((val) => /[^a-zA-Z0-9]/.test(val), {
    message: 'Password must contain at least 1 symbol',
  });

/**
 * MongoDB ObjectId validator schema
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: 'Invalid ID format',
});

/**
 * Page name validator schema
 */
export const pageNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Page name is required' })
  .max(100, { message: 'Page name must be less than 100 characters' });

/**
 * Signup validation schema
 */
export const signupSchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required' }),
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: passwordSchema,
});

/**
 * Create page validation schema
 */
export const createPageSchema = z.object({
  pageName: pageNameSchema,
});

/**
 * Update page validation schema
 */
export const updatePageSchema = z.object({
  pageId: objectIdSchema,
  pageData: z.string().optional(),
});

export const taskNameSchema = z
  .string()
  .min(1, {message:' Task name is required'})
  .max(200, {message:'Task name must be less than 200 characters'});

export const taskDescriptionSchema = z
  .string()
  .max(1000, {message: 'Task description must be less than 1000 characters'})
  .optional();

export const taskDeadlineSchema = z
  .string()
  .datetime({message: 'Invalid date format'})
  .or(z.null())
  .optional();

export const createTaskSchema = z.object({
  taskName: taskNameSchema,
  taskDescription: taskDescriptionSchema,
  taskDeadline: taskDeadlineSchema,
  parentTaskId: objectIdSchema.optional(),
});

export const updateTaskSchema = z.object({
  taskId: objectIdSchema,
  taskName: taskNameSchema.optional(),
  taskDescription: taskDescriptionSchema,
  taskDeadline: taskDeadlineSchema,
  isTaskCompleted: z.boolean().optional(),
});

export const getTaskIdSchema = z.object({
  taskId: objectIdSchema,
});

export const toggleTaskCompletionSchema = z.object({
  taskId: objectIdSchema,
});


/**
 * Validate input against schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {object} Validation result
 */
export const validate = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return {
      isValid: false,
      errors,
      message: errors.map((e) => e.message).join(', '),
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
};

export default {
  emailSchema,
  passwordSchema,
  objectIdSchema,
  pageNameSchema,
  signupSchema,
  loginSchema,
  changePasswordSchema,
  createPageSchema,
  updatePageSchema,
  validate,
};
