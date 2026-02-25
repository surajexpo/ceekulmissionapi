const authenticateUser = require('./authenticateUser.js');
const authenticateAdmin = require('./authenticateAdmin.js');
const fileUploader = require('./fileUploader.js');
const {
    authenticateTeacher,
    verifyCourseOwnership,
    verifyCourseEditable
} = require('./authenticateTeacher.js');

module.exports = {
    authenticateUser,
    authenticateAdmin,
    authenticateTeacher,
    verifyCourseOwnership,
    verifyCourseEditable,
    fileUploader,
};