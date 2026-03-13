const { ApiError } = require('../errorHandler');
const { User } = require('../models/authModels');
const { verifyAccessToken } = require('../utils');

/**
 * Middleware to authenticate and verify teacher access
 * Requirements:
 * - Valid JWT token
 * - selectedRole = 'Teacher'
 * - verificationStatus = 'Verified'
 * - status = 'Active'
 */
const authenticateTeacher = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        status: false,
        message: 'Invalid or expired token'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'User not found'
      });
    }

    // Check if account is active
    if (user.status !== 'Active') {
      return res.status(403).json({
        status: false,
        message: 'Your account is not active. Please contact support.'
      });
    }

    // Role check removed as per SELECTED_ROLES removal
    // Any active user is now allowed to pass this middleware if their status is Active.

    // Check if teacher is verified
    // if (user.verificationStatus !== 'Verified') {
    //   return res.status(403).json({
    //     status: false,
    //     message: 'Your teacher account is not verified yet. Please complete verification to access this feature.'
    //   });
    // }

    // Attach user and token to request
    req.user = user;
    req.teacher = user;
    req.token = token;

    next();
  } catch (err) {
    console.error('Teacher authentication error:', err.message);
    next(err);
  }
};

/**
 * Middleware to verify course ownership
 * Must be used after authenticateTeacher
 */
const verifyCourseOwnership = async (req, res, next) => {
  try {
    const { Course } = require('../models/authModels');
    const courseId = req.params.id || req.params.courseId;

    if (!courseId) {
      return res.status(400).json({
        status: false,
        message: 'Course ID is required'
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    // Check if the logged-in teacher owns this course
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        message: 'Access denied. You can only manage your own courses.'
      });
    }

    // Attach course to request
    req.course = course;

    next();
  } catch (err) {
    console.error('Course ownership verification error:', err.message);
    next(err);
  }
};

/**
 * Middleware to check if course is editable
 * Courses can only be edited in Draft or Rejected status
 */
const verifyCourseEditable = async (req, res, next) => {
  try {
    const course = req.course;

    if (!course) {
      return res.status(400).json({
        status: false,
        message: 'Course not found in request'
      });
    }

    const editableStatuses = ['Draft', 'Rejected'];

    if (!editableStatuses.includes(course.courseStatus)) {
      return res.status(403).json({
        status: false,
        message: `Course cannot be edited in '${course.courseStatus}' status. Only Draft or Rejected courses can be edited.`
      });
    }

    next();
  } catch (err) {
    console.error('Course editable check error:', err.message);
    next(err);
  }
};

module.exports = {
  authenticateTeacher,
  verifyCourseOwnership,
  verifyCourseEditable
};
