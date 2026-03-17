const { Enrollment } = require('../../models/authModels');

/**
 * Get all workshops where the current user is enrolled
 * GET /api/v1/workshops/enrolled/my
 * @access Student or Instructor (logged in)
 */
const getMyEnrolledWorkshops = async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ userId })
      .populate({
        path: 'workshopId',
        select: '-__v'
      })
      .sort({ enrolledAt: -1 });

    // Filter out cases where the workshop might have been hard-deleted
    const enrolledWorkshops = enrollments
      .filter(enrollment => enrollment.workshopId)
      .map(enrollment => ({
        enrollmentId: enrollment._id,
        role: enrollment.role,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        workshop: enrollment.workshopId
      }));

    return res.status(200).json({
      status: true,
      message: 'Enrolled workshops fetched successfully',
      count: enrolledWorkshops.length,
      data: enrolledWorkshops
    });

  } catch (error) {
    console.error('Get My Enrolled Workshops Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch enrolled workshops'
    });
  }
};

module.exports = getMyEnrolledWorkshops;
