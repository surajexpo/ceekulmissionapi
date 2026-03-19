const User = require('./userModel.js');
const Admin = require('./adminModel.js');
const OTPModel = require('./otpModel.js');
const EmailOTPModel = require('./emailOtpModel.js');
const Course = require('../courseModel.js');
const Workshop = require('../workshopModel.js');

const Enrollment = require('../enrollmentModel.js');

const PartnerInfrastructure = require('../partnerInfrastructure.model.js');

module.exports = {
    User,
    Admin,
    OTPModel,
    EmailOTPModel,
    Course,
    Workshop,
    Enrollment,
    PartnerInfrastructure
};
