const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isValidTimezone = (tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const sessionSchema = z.object({
  date: z
    .string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  startTime: z
    .string()
    .regex(timeRegex, 'Start time must be in HH:mm format'),
  endTime: z
    .string()
    .regex(timeRegex, 'End time must be in HH:mm format'),
  activity: z
    .string()
    .trim()
    .min(1, 'Activity is required')
    .max(200, 'Activity cannot exceed 200 characters'),
  fee: z
    .number({ invalid_type_error: 'Fee must be a number' })
    .min(0, 'Fee must be non-negative'),
  mode: z.enum(['online', 'hybrid'], {
    errorMap: () => ({ message: 'Session mode must be "online" or "hybrid"' })
  }),
  location: z.string().trim().nullable().optional()
})
  .refine(
    (s) => s.startTime < s.endTime,
    { message: 'Start time must be before end time', path: ['endTime'] }
  )
  .refine(
    (s) => s.mode !== 'hybrid' || (s.location && s.location.length > 0),
    { message: 'Location is required for hybrid sessions', path: ['location'] }
  );

const createWorkshopSchema = z.object({
  workshopTitle: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  workshopDescription: z
    .string()
    .trim()
    .min(1, 'Workshop description is required')
    .max(5000, 'Description cannot exceed 5000 characters'),
  expertDescription: z
    .string()
    .trim()
    .max(2000, 'Expert description cannot exceed 2000 characters')
    .optional(),
  workshopMode: z.enum(['online', 'hybrid'], {
    errorMap: () => ({ message: 'Workshop mode must be "online" or "hybrid"' })
  }),
  timezone: z
    .string()
    .trim()
    .refine(isValidTimezone, 'Invalid IANA timezone string'),
  instructorType: z.enum(['myself', 'open'], {
    errorMap: () => ({ message: 'Instructor type must be "myself" or "open"' })
  }),
  sessions: z
    .array(sessionSchema)
    .min(1, 'At least one session is required')
});

const updateWorkshopSchema = z.object({
  workshopTitle: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters')
    .optional(),
  workshopDescription: z
    .string()
    .trim()
    .min(1, 'Workshop description is required')
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional(),
  expertDescription: z
    .string()
    .trim()
    .max(2000, 'Expert description cannot exceed 2000 characters')
    .optional(),
  workshopMode: z
    .enum(['online', 'hybrid'], {
      errorMap: () => ({ message: 'Workshop mode must be "online" or "hybrid"' })
    })
    .optional(),
  timezone: z
    .string()
    .trim()
    .refine(isValidTimezone, 'Invalid IANA timezone string')
    .optional(),
  instructorType: z
    .enum(['myself', 'open'], {
      errorMap: () => ({ message: 'Instructor type must be "myself" or "open"' })
    })
    .optional(),
  sessions: z
    .array(sessionSchema)
    .min(1, 'At least one session is required')
    .optional()
});

// Used for POST /workshops/:id/sessions — accepts 1 or more sessions in one request
const addSessionsSchema = z.object({
  sessions: z.array(sessionSchema).min(1, 'At least one session is required')
});

module.exports = { sessionSchema, addSessionsSchema, createWorkshopSchema, updateWorkshopSchema };
