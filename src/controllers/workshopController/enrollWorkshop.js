const { Workshop, Enrollment } = require('../../models/authModels');

/**
 * Enroll in a workshop
 * POST /api/v1/workshops/:workshopId/enroll
 * @access Student or Instructor (logged in)
 */
const enrollWorkshop = async (req, res) => {
  try {
    const { workshopId } = req.params;
    let { role } = req.body;
    const userId = req.user._id;

    if (!role) {
      return res.status(400).json({
        status: false,
        message: 'Role is required. Must be instructor or learner.'
      });
    }

    // Normalize and map roles
    const normalizedRole = role.trim().toLowerCase();
    let internalRole;

    if (normalizedRole === 'instructor') {
      internalRole = 'Instructor';
    } else if (normalizedRole === 'learner' || normalizedRole === 'student') {
      internalRole = 'Student';
    } else {
      return res.status(400).json({
        status: false,
        message: 'Invalid role. Must be either instructor or learner.'
      });
    }

    role = internalRole;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({
        status: false,
        message: 'Workshop not found'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({ workshopId, userId });
    if (existingEnrollment) {
      return res.status(400).json({
        status: false,
        message: 'You are already enrolled in this workshop'
      });
    }

    // Enrollment Rules
    // Anyone can enroll as an instructor or student regardless of instructorType
    // (Simplification based on user request)

    // In a real system, we might check if a student has paid if the workshop is paid
    // But for now, we follow the basic enrollment rules

    const enrollment = new Enrollment({
      workshopId,
      userId,
      role,
      status: 'active'
    });

    await enrollment.save();

    // Upgrade user role if they enrolled as an instructor
    if (role === 'Instructor') {
      const { User } = require('../../models/authModels');
      await User.findByIdAndUpdate(userId, { 
        $set: { 
          role: 'Teacher',
          selectedRole: 'Teacher'
        } 
      });
    }

    return res.status(201).json({
      status: true,
      message: `Enrolled successfully as ${role}`,
      data: enrollment
    });

  } catch (error) {
    console.error('Enroll Workshop Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to enroll in workshop'
    });
  }
};

module.exports = enrollWorkshop;
