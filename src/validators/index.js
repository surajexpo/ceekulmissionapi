const {
  signupSchema,
  updateProfileSchema,
  phoneSchema,
  emailSchema,
  passwordSchema,
  addressSchema,
} = require('./userValidator');

const { adminRegisterSchema } = require('./adminValidator');
const {
  infrastructureSchema,
  classroomSchema,
  classroomUpdateSchema,
  computerLabSchema,
  computerLabUpdateSchema,
  facilitySchema,
  facilityUpdateSchema,
  infrastructureUpdateSchema
} = require('./infrastructure.validator');

module.exports = {
  signupSchema,
  updateProfileSchema,
  phoneSchema,
  emailSchema,
  passwordSchema,
  addressSchema,
  adminRegisterSchema,
  infrastructureSchema,
  classroomSchema,
  classroomUpdateSchema,
  computerLabSchema,
  computerLabUpdateSchema,
  facilitySchema,
  facilityUpdateSchema,
  infrastructureUpdateSchema
};
