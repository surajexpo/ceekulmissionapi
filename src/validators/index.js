const {
  signupSchema,
  updateProfileSchema,
  phoneSchema,
  emailSchema,
  passwordSchema,
  addressSchema,
} = require('./userValidator');

const { adminRegisterSchema } = require('./adminValidator');

module.exports = {
  signupSchema,
  updateProfileSchema,
  phoneSchema,
  emailSchema,
  passwordSchema,
  addressSchema,
  adminRegisterSchema,
};
