const workshopRoute = require('express').Router();
const {
  createWorkshop,
  getMyWorkshops,
  getWorkshop,
  updateWorkshop,
  cancelWorkshop,
  addSession,
  deleteSession
} = require('../controllers/workshopController');
const { authenticateTeacher } = require('../middlewares');
const validateRequest = require('../middlewares/validateRequest');
const { addSessionsSchema, createWorkshopSchema, updateWorkshopSchema } = require('../validators/workshopValidator');

/**
 * @route   POST /api/v1/workshops
 * @desc    Create a new workshop
 * @access  Teacher (verified)
 */
workshopRoute.post(
  '/',
  authenticateTeacher,
  validateRequest(createWorkshopSchema),
  createWorkshop
);

/**
 * @route   GET /api/v1/workshops/my
 * @desc    Get all workshops created by the logged-in teacher
 * @access  Teacher (verified)
 */
workshopRoute.get('/my', authenticateTeacher, getMyWorkshops);

/**
 * @route   GET /api/v1/workshops/:id
 * @desc    Get a single workshop by ID (owner only)
 * @access  Teacher (verified)
 */
workshopRoute.get('/:id', authenticateTeacher, getWorkshop);

/**
 * @route   PUT /api/v1/workshops/:id
 * @desc    Update a workshop (draft status only)
 * @access  Teacher (verified) — owner only
 */
workshopRoute.put(
  '/:id',
  authenticateTeacher,
  validateRequest(updateWorkshopSchema),
  updateWorkshop
);

/**
 * @route   PATCH /api/v1/workshops/:id/cancel
 * @desc    Cancel a workshop (soft delete)
 * @access  Teacher (verified) — owner only
 */
workshopRoute.patch('/:id/cancel', authenticateTeacher, cancelWorkshop);

// ==================== SESSION MANAGEMENT ====================

/**
 * @route   POST /api/v1/workshops/:id/sessions
 * @desc    Add one or more sessions to a draft workshop in a single request.
 *          Body: { "sessions": [ {...}, {...} ] }
 *          Validates per-session rules + cross-session + existing overlap.
 * @access  Teacher (verified) — owner only, draft only
 */
workshopRoute.post(
  '/:id/sessions',
  authenticateTeacher,
  validateRequest(addSessionsSchema),
  addSession
);

/**
 * @route   DELETE /api/v1/workshops/:id/sessions/:sessionId
 * @desc    Remove a session from a draft workshop by its subdocument _id.
 *          At least one session must remain.
 * @access  Teacher (verified) — owner only, draft only
 */
workshopRoute.delete(
  '/:id/sessions/:sessionId',
  authenticateTeacher,
  deleteSession
);

module.exports = workshopRoute;
