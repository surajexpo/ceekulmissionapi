const { Enrollment } = require('../../models/authModels');
const Workshop = require('../../models/workshopModel');

/**
 * Get all enrollees for a specific workshop
 * GET /api/v1/workshops/:id/enrollees
 * @access Expert (Owner only)
 */
const getWorkshopEnrollees = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // Optional filter: 'Student', 'Instructor', or 'Expert'
    const userId = req.user._id;

    // 1. Verify existence of workshop and ownership
    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({
        status: false,
        message: 'Workshop not found'
      });
    }

    // Check if the user is the creator
    const isCreator = workshop.createdBy.toString() === userId.toString();

    // Check if the user is an enrolled instructor?
    // (Optional: if the user mentioned "enrolled as instructor", they might also want to see enrollees)
    // For now, keep it to creator (Expert) only as per user request "as an expert"
    if (!isCreator) {
      return res.status(403).json({
        status: false,
        message: 'Access denied. Only the workshop creator can view enrollees.'
      });
    }

    // 2. Build query
    const query = { workshopId: id };
    if (role) {
      // Normalize role for query if provided
      const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
      if (['Expert', 'Instructor', 'Student'].includes(normalizedRole)) {
        query.role = normalizedRole;
      }
    }

    // 3. Fetch all enrollments for this workshop
    const enrollments = await Enrollment.find(query)
      .populate('userId', 'name email profileImage phone') // Added 'phone' as it might be useful for experts
      .sort({ enrolledAt: -1 });

    return res.status(200).json({
      status: true,
      message: role ? `Enrollees for role '${role}' fetched successfully` : 'All enrollees fetched successfully',
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Get Workshop Enrollees Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch enrollees'
    });
  }
};

module.exports = getWorkshopEnrollees;
