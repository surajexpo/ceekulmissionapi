const { z } = require('zod');
const {
  PARTNER_TYPES,
  GENDERS,
  ACTIVITY_TYPES,
  MODE_OPTIONS,
  EXPERT_TYPES,
  AUTH_PROVIDERS,
} = require('../constants/userConstants');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    'Password must contain uppercase, lowercase, digit, and special character'
  );

const addressSchema = z.object({
  village: z.string().trim().min(1, 'Village is required').max(200),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  district: z.string().trim().min(1, 'District is required').max(100),
});

const signupSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: passwordSchema.optional(),
    authProvider: z.enum(AUTH_PROVIDERS).optional(),

    name: z.string().trim().min(1, 'Name is required').max(100),
    gender: z.enum(GENDERS),
    dateOfBirth: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val))
      .refine((date) => date < new Date(), 'Date of birth must be in the past'),

    address: addressSchema,

    partnerType: z.enum(PARTNER_TYPES).optional(),

    activityType: z
      .array(z.enum(ACTIVITY_TYPES))
      .optional()
      .default([]),
    modeOptions: z
      .array(z.enum(MODE_OPTIONS))
      .optional()
      .default([]),
    expertTypes: z
      .array(z.enum(EXPERT_TYPES))
      .optional()
      .default([]),
  })
  .refine(
    (data) => data.email || data.phone,
    { message: 'Either email or phone is required', path: ['email'] }
  )
  .refine(
    (data) => {
      if (data.email && data.authProvider !== 'MOBILE_OTP') {
        return !!data.password;
      }
      return true;
    },
    { message: 'Password is required for email authentication', path: ['password'] }
  );

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  gender: z.enum(GENDERS).optional(),
  dateOfBirth: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => date < new Date(), 'Date of birth must be in the past')
    .optional(),
  address: addressSchema.partial().optional(),
  activityType: z.array(z.enum(ACTIVITY_TYPES)).optional(),
  modeOptions: z.array(z.enum(MODE_OPTIONS)).optional(),
  expertTypes: z.array(z.enum(EXPERT_TYPES)).optional(),
});

module.exports = {
  signupSchema,
  updateProfileSchema,
  phoneSchema,
  emailSchema,
  passwordSchema,
  addressSchema,
};
