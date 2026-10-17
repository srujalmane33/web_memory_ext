import { z } from 'zod';
import { isValidHttpUrl, LIMITS, MEMORY_TYPES } from '@web-memory/shared';

export function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validated = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.errors[0]?.message || 'Invalid input data',
            details: err.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
}

// Schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createMemorySchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(LIMITS.TITLE_MAX_LENGTH, `Title cannot exceed ${LIMITS.TITLE_MAX_LENGTH} characters`),
    url: z.string().trim().refine(isValidHttpUrl, {
      message: 'URL must be a valid http or https web address',
    }),
    type: z.enum(MEMORY_TYPES).optional().default('page'),
    selectedText: z.string().max(LIMITS.SELECTED_TEXT_MAX_LENGTH, `Selected text cannot exceed ${LIMITS.SELECTED_TEXT_MAX_LENGTH} characters`).optional().default(''),
    note: z.string().max(LIMITS.NOTE_MAX_LENGTH, `Note cannot exceed ${LIMITS.NOTE_MAX_LENGTH} characters`).optional().default(''),
    tags: z.union([z.array(z.string()), z.string()]).optional().default([]),
  }),
});

export const updateMemorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid memory ID format'),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(LIMITS.TITLE_MAX_LENGTH).optional(),
    url: z.string().trim().refine(isValidHttpUrl, {
      message: 'URL must be a valid http or https web address',
    }).optional(),
    type: z.enum(MEMORY_TYPES).optional(),
    selectedText: z.string().max(LIMITS.SELECTED_TEXT_MAX_LENGTH).optional(),
    note: z.string().max(LIMITS.NOTE_MAX_LENGTH).optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
  }).strict(), // disallows any unallowed fields like userId, _id, etc.
});
