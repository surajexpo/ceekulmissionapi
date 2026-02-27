const User = require('./userModel.js');
const Admin = require('./adminModel.js');
const OTPModel = require('./otpModel.js');
const EmailOTPModel = require('./emailOtpModel.js');
const Course = require('../courseModel.js');
const Workshop = require('../workshopModel.js');

module.exports = {
    User,
    Admin,
    OTPModel,
    EmailOTPModel,
    Course,
    Workshop,
};
