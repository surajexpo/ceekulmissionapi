const workshopRoute = require('express').Router();
const {
  getAllWorkshops,
  createWorkshop,
  getMyWorkshops,
  getWorkshop,
  updateWorkshop,
  cancelWorkshop,
  addSession,
  deleteSession,
  deleteWorkshop
} = require('../controllers/workshopController');
const { authenticateUser } = require('../middlewares');
const validateRequest = require('../middlewares/validateRequest');
const { addSessionsSchema, createWorkshopSchema, updateWorkshopSchema } = require('../validators/workshopValidator');


/**
 * @route   GET /api/v1/workshops
 * @desc    Get all public workshops (published or active)
 * @access  Public
 */
workshopRoute.get('/', getAllWorkshops);

/**
 * @route   POST /api/v1/workshops
 * @desc    Create a new workshop
 * @access  User
 */
workshopRoute.post(
  '/',
  authenticateUser,
  validateRequest(createWorkshopSchema),
  createWorkshop
);

/**
 * @route   GET /api/v1/workshops/my
 * @desc    Get all workshops created by the logged-in teacher
 * @access  User
 */
workshopRoute.get('/my', authenticateUser, getMyWorkshops);

/**
 * @route   GET /api/v1/workshops/:id
 * @desc    Get a single workshop by ID (owner only)
 * @access  User
 */
workshopRoute.get('/:id', authenticateUser, getWorkshop);

/**
 * @route   PUT /api/v1/workshops/:id
 * @desc    Update a workshop (draft status only)
 * @access  User — owner only
 */
workshopRoute.put(
  '/:id',
  authenticateUser,
  validateRequest(updateWorkshopSchema),
  updateWorkshop
);

/**
 * @route   PATCH /api/v1/workshops/:id/cancel
 * @desc    Cancel a workshop (soft delete)
 * @access  User — owner only
 */
workshopRoute.patch('/:id/cancel', authenticateUser, cancelWorkshop);

/**
 * @route   DELETE /api/v1/workshops/:id
 * @desc    Delete a workshop (hard delete)
 * @access  User — owner only, draft or cancelled status only
 */
workshopRoute.delete('/:id', authenticateUser, deleteWorkshop);

// ==================== SESSION MANAGEMENT ====================

/**
 * @route   POST /api/v1/workshops/:id/sessions
 * @desc    Add one or more sessions to a draft workshop in a single request.
 *          Body: { "sessions": [ {...}, {...} ] }
 *          Validates per-session rules + cross-session + existing overlap.
 * @access  User — owner only, draft only
 */
workshopRoute.post(
  '/:id/sessions',
  authenticateUser,
  validateRequest(addSessionsSchema),
  addSession
);

/**
 * @route   DELETE /api/v1/workshops/:id/sessions/:sessionId
 * @desc    Remove a session from a draft workshop by its subdocument _id.
 *          At least one session must remain.
 * @access  User — owner only, draft only
 */
workshopRoute.delete(
  '/:id/sessions/:sessionId',
  authenticateUser,
  deleteSession
);

module.exports = workshopRoute;
