const express = require('express');
const router = express.Router();
const nearbyController = require('../controllers/nearbyController');

router.get('/partners', nearbyController.getNearbyPartners);
router.get('/workshops', nearbyController.getNearbyWorkshops);
router.get('/instructors', nearbyController.getNearbyInstructors);

module.exports = router;
