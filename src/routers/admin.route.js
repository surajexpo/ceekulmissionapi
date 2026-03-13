const adminRoute = require("express").Router();
const { authenticateAdmin } = require("../middlewares");
const { login, profile, update, register, forgetPassword, verifyOTP, resetPassword }
= require('../controllers/adminController');
const { validateRequest } = require("../middlewares");
const { adminRegisterSchema } = require("../validators");
const {
  getPendingCourses,
  getCourseForReview,
  startReview,
  approveCourse,
  rejectCourse,
  requestChanges,
  toggleFeature,
  getAllCoursesAdmin
} = require('../controllers/courseController');

// ==================== ADMIN AUTH ====================
adminRoute.post("/register", validateRequest(adminRegisterSchema), register);
adminRoute.post("/login", login);
adminRoute.get("/profile", authenticateAdmin, profile);
adminRoute.put("/update", authenticateAdmin, update);

// Forget password
adminRoute.post("/forgetPassword", forgetPassword);
adminRoute.post("/verifyOTP", verifyOTP);
adminRoute.post("/resetPassword", resetPassword);

// ==================== COURSE MANAGEMENT ====================

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses (admin view)
 * @access  Admin
 */
adminRoute.get("/courses", authenticateAdmin, getAllCoursesAdmin);

/**
 * @route   GET /api/admin/courses/pending
 * @desc    Get courses pending review
 * @access  Admin
 */
adminRoute.get("/courses/pending", authenticateAdmin, getPendingCourses);

/**
 * @route   GET /api/admin/courses/:id/review
 * @desc    Get course details for review
 * @access  Admin
 */
adminRoute.get("/courses/:id/review", authenticateAdmin, getCourseForReview);

/**
 * @route   POST /api/admin/courses/:id/start-review
 * @desc    Start reviewing a course
 * @access  Admin
 */
adminRoute.post("/courses/:id/start-review", authenticateAdmin, startReview);

/**
 * @route   POST /api/admin/courses/:id/approve
 * @desc    Approve a course
 * @access  Admin
 */
adminRoute.post("/courses/:id/approve", authenticateAdmin, approveCourse);

/**
 * @route   POST /api/admin/courses/:id/reject
 * @desc    Reject a course
 * @access  Admin
 */
adminRoute.post("/courses/:id/reject", authenticateAdmin, rejectCourse);

/**
 * @route   POST /api/admin/courses/:id/request-changes
 * @desc    Request changes on a course
 * @access  Admin
 */
adminRoute.post("/courses/:id/request-changes", authenticateAdmin, requestChanges);

/**
 * @route   POST /api/admin/courses/:id/feature
 * @desc    Feature/unfeature a course
 * @access  Admin
 */
adminRoute.post("/courses/:id/feature", authenticateAdmin, toggleFeature);

// ==================== USER MANAGEMENT ====================
const {
  verifyTeacher,
  manageTeacher,
  listUsers,
} = require('../controllers/adminController/userManagement');

/**
 * @route   GET /admin/users
 * @desc    List users with filters (role, verificationStatus, search)
 * @access  Admin
 */
adminRoute.get("/users", authenticateAdmin, listUsers);

/**
 * @route   PUT /admin/users/:userId/manage
 * @desc    Admin oversight: suspend | activate | revoke | force_verify a teacher
 * @access  Admin
 */
adminRoute.put("/users/:userId/manage", authenticateAdmin, manageTeacher);

module.exports = adminRoute;
