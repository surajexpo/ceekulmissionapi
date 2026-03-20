const { PartnerInfrastructure, User, Workshop } = require('../models/authModels');

/**
 * Get nearby partners (schools/infrastructures)
 * GET /api/nearby/partners?lat=...&lng=...&radius=...
 */
exports.getNearbyPartners = async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                status: false,
                message: 'Latitude and longitude are required'
            });
        }

        const partners = await PartnerInfrastructure.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000 // radius in meters
                }
            }
        }).populate('partnerId', 'name email phone profileImage');

        res.status(200).json({
            status: true,
            results: partners.length,
            data: partners
        });
    } catch (error) {
        console.error('Error in getNearbyPartners:', error);
        res.status(500).json({
            status: false,
            message: 'Server error while fetching nearby partners',
            error: error.message
        });
    }
};

/**
 * Get nearby workshops
 * GET /api/nearby/workshops?lat=...&lng=...&radius=...
 */
exports.getNearbyWorkshops = async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                status: false,
                message: 'Latitude and longitude are required'
            });
        }

        const workshops = await Workshop.find({
            status: 'published',
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000
                }
            }
        }).populate('createdBy', 'name email profileImage');

        res.status(200).json({
            status: true,
            results: workshops.length,
            data: workshops
        });
    } catch (error) {
        console.error('Error in getNearbyWorkshops:', error);
        res.status(500).json({
            status: false,
            message: 'Server error while fetching nearby workshops',
            error: error.message
        });
    }
};

/**
 * Get nearby instructors (Teachers)
 * GET /api/nearby/instructors?lat=...&lng=...&radius=...
 */
exports.getNearbyInstructors = async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                status: false,
                message: 'Latitude and longitude are required'
            });
        }

        const instructors = await User.find({
            role: { $in: ['teacher', 'Teacher', 'Instructor'] },
            status: 'Active',
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000
                }
            }
        }).select('name email phone profileImage teacherProfile address');

        res.status(200).json({
            status: true,
            results: instructors.length,
            data: instructors
        });
    } catch (error) {
        console.error('Error in getNearbyInstructors:', error);
        res.status(500).json({
            status: false,
            message: 'Server error while fetching nearby instructors',
            error: error.message
        });
    }
};
