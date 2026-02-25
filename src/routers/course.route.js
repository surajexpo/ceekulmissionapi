const courseRoute = require('express').Router();
const {
  getCoursePublic,
  getPublishedCourses,
  getFeaturedCourses,
  getCoursesByCategory
} = require('../controllers/courseController');

// ==================== PUBLIC COURSE ROUTES ====================

/**
 * @route   GET /api/courses
 * @desc    Get all published courses (with filters & pagination)
 * @access  Public
 * @query   page, limit, category, subCategory, level, pricingType, minPrice, maxPrice, minRating, language, search, sortBy, sortOrder
 */
courseRoute.get('/', getPublishedCourses);

/**
 * @route   GET /api/courses/featured
 * @desc    Get featured courses
 * @access  Public
 * @query   limit
 */
courseRoute.get('/featured', getFeaturedCourses);

/**
 * @route   GET /api/courses/category/:category
 * @desc    Get courses by category
 * @access  Public
 * @query   page, limit, subCategory
 */
courseRoute.get('/category/:category', getCoursesByCategory);

/**
 * @route   GET /api/courses/:idOrSlug
 * @desc    Get single course by ID or slug
 * @access  Public
 */
courseRoute.get('/:idOrSlug', getCoursePublic);

module.exports = courseRoute;
