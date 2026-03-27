const Workshop = require('../../models/workshopModel');
const Enrollment = require('../../models/enrollmentModel');
const User = require('../../models/authModels/userModel');

/**
 * Enroll in a workshop
 * POST /api/v1/workshops/:workshopId/enroll
 * @access Student or Instructor (logged in)
 */
const enrollWorkshop = async (req, res) => {
  try {
    const { workshopId } = req.params;
    let { role, scheduleId } = req.body;
    const userId = req.user._id;

    console.log('Enroll Request:', { workshopId, role, scheduleId, userId });

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

    // Validate scheduleId if provided or if role is Student
    if (role === 'Student' && !scheduleId) {
      return res.status(400).json({
        status: false,
        message: 'A specific schedule must be selected for student enrollment.'
      });
    }

    if (scheduleId) {
      const scheduleExists = workshop.schedules.some(s => s._id.toString() === scheduleId);
      if (!scheduleExists) {
        return res.status(400).json({
          status: false,
          message: 'The selected schedule does not belong to this workshop.'
        });
      }
    }

    // Check if user is already enrolled with this role in this workshop
    const query = { workshopId, userId, role };
    if (scheduleId) query.scheduleId = scheduleId;
    
    console.log('Duplicate Check Query:', query);
    const existingEnrollment = await Enrollment.findOne(query);
    if (existingEnrollment) {
      return res.status(400).json({
        status: false,
        message: scheduleId ? `You are already enrolled as ${role.toLowerCase()} in this schedule` : `You are already enrolled as ${role.toLowerCase()} in this workshop`
      });
    }

    const enrollment = new Enrollment({
      workshopId,
      userId,
      role,
      scheduleId: scheduleId || undefined,
      status: 'active'
    });

    console.log('Final Enrollment Payload:', enrollment);
    await enrollment.save();

    // Upgrade user role if they enrolled as an instructor
    if (role === 'Instructor') {
      try {
        await User.findByIdAndUpdate(userId, { 
          $set: { 
            role: 'Teacher',
            selectedRole: 'Teacher'
          } 
        });
      } catch (err) {
        console.error('User Role Upgrade Error (swallowed):', err);
      }
    }

    return res.status(201).json({
      status: true,
      message: `Enrolled successfully as ${role}`,
      data: enrollment
    });

  } catch (error) {
    console.error('Enroll Workshop Global Catch:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to enroll in workshop'
    });
  }
};

module.exports = enrollWorkshop;
