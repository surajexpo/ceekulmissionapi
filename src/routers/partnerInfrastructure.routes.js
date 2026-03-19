const express = require('express');
const router = express.Router();
const PartnerInfrastructureController = require('../controllers/partnerInfrastructure.controller');
const { authenticateUser, authorizePartner, validateRequest } = require('../middlewares');
const { 
  infrastructureSchema,
  infrastructureUpdateSchema,
  classroomSchema,
  classroomUpdateSchema,
  computerLabSchema,
  computerLabUpdateSchema,
  facilitySchema,
  facilityUpdateSchema
} = require('../validators');

/**
 * @route   GET /api/partners/infrastructure
 * @desc    List all infrastructures for the logged-in partner
 */
router.get(
  '/',
  authenticateUser,
  PartnerInfrastructureController.listInfrastructures
);

/**
 * @route   POST /api/partners/infrastructure
 * @desc    Create a new infrastructure record
 */
router.post(
  '/',
  authenticateUser,
  validateRequest(infrastructureSchema),
  PartnerInfrastructureController.createInfrastructure
);

/**
 * @route   GET /api/partners/infrastructure/:infraId
 * @desc    Get details of a specific infrastructure
 */
router.get(
  '/:infraId',
  authenticateUser,
  PartnerInfrastructureController.getInfrastructure
);

/**
 * @route   PATCH /api/partners/infrastructure/:infraId
 * @desc    Update top-level details of a specific infrastructure
 */
router.patch(
  '/:infraId',
  authenticateUser,
  validateRequest(infrastructureUpdateSchema),
  PartnerInfrastructureController.updateInfrastructure
);

/**
 * @route   DELETE /api/partners/infrastructure/:infraId
 * @desc    Delete a specific infrastructure record
 */
router.delete(
  '/:infraId',
  authenticateUser,
  PartnerInfrastructureController.deleteInfrastructure
);

// --- Granular Nested Resource Routes ---

// Classrooms
router.post(
  '/:infraId/classrooms',
  authenticateUser,
  validateRequest(classroomSchema),
  PartnerInfrastructureController.addClassroom
);

router.patch(
  '/:infraId/classrooms/:id',
  authenticateUser,
  validateRequest(classroomUpdateSchema),
  PartnerInfrastructureController.updateClassroom
);

router.delete(
  '/:infraId/classrooms/:id',
  authenticateUser,
  PartnerInfrastructureController.deleteClassroom
);

// Computer Labs
router.post(
  '/:infraId/computer-labs',
  authenticateUser,
  validateRequest(computerLabSchema),
  PartnerInfrastructureController.addComputerLab
);

router.patch(
  '/:infraId/computer-labs/:id',
  authenticateUser,
  validateRequest(computerLabUpdateSchema),
  PartnerInfrastructureController.updateComputerLab
);

router.delete(
  '/:infraId/computer-labs/:id',
  authenticateUser,
  PartnerInfrastructureController.deleteComputerLab
);

// Other Facilities
router.post(
  '/:infraId/facilities',
  authenticateUser,
  validateRequest(facilitySchema),
  PartnerInfrastructureController.addFacility
);

router.patch(
  '/:infraId/facilities/:id',
  authenticateUser,
  validateRequest(facilityUpdateSchema),
  PartnerInfrastructureController.updateFacility
);

router.delete(
  '/:infraId/facilities/:id',
  authenticateUser,
  PartnerInfrastructureController.deleteFacility
);

module.exports = router;
