const Enrollment = require('../../models/enrollmentModel');
const mongoose = require('mongoose');

/**
 * Unenroll from a workshop schedule
 * DELETE /api/v1/workshops/:workshopId/enroll/:enrollmentId
 * @access User (logged in)
 */
const unenrollWorkshop = async (req, res) => {
  try {
    const { workshopId, enrollmentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(workshopId) || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid workshop or enrollment ID'
      });
    }

    // Find the enrollment and ensure it belongs to the current user
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      workshopId,
      userId
    });

    if (!enrollment) {
      return res.status(404).json({
        status: false,
        message: 'Enrollment not found or access denied'
      });
    }

    // Hard delete to allow re-enrollment if needed
    await Enrollment.findByIdAndDelete(enrollmentId);

    return res.status(200).json({
      status: true,
      message: 'Unenrolled successfully'
    });

  } catch (error) {
    console.error('Unenroll Workshop Error:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to unenroll from workshop'
    });
  }
};

module.exports = unenrollWorkshop;
