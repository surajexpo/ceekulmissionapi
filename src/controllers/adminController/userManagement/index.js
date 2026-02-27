const changeUserRole = require("./changeUserRole");
const verifyTeacher = require("./verifyTeacher"); // kept for backward compat
const manageTeacher = require("./manageTeacher");
const listUsers = require("./listUsers");

module.exports = {
  changeUserRole,
  verifyTeacher,
  manageTeacher,
  listUsers,
};
