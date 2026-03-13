const { z } = require('zod');
const {
  emailSchema,
  passwordSchema,
  phoneSchema,
} = require('./userValidator');

const adminRegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: emailSchema,
  password: passwordSchema,
  number: phoneSchema,
  role: z.enum(['admin', 'superadmin']).optional().default('admin'),
});

module.exports = {
  adminRegisterSchema,
};
