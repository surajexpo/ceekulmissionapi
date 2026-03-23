const Workshop = require('../../models/workshopModel');
const mongoose = require('mongoose');

/**
 * Get a single workshop by ID
 * GET /api/v1/workshops/:id
 * @access Teacher (verified) — owner only
 */
const getWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: 'Invalid workshop ID' });
    }

    const workshop = await Workshop.findById(id).select('-__v');

    if (!workshop) {
      return res.status(404).json({ status: false, message: 'Workshop not found' });
    }

    // Access check: Owner, Enrolled user, or anyone if workshop is published
    const { Enrollment } = require('../../models/authModels');
    const enrollment = await Enrollment.findOne({ workshopId: id, userId: req.user._id });
    const isOwner = workshop.createdBy.toString() === req.user._id.toString();

    const isPublicStatus = ['published', 'active', 'ongoing'].includes(workshop.status);
    
    if (!isOwner && !enrollment && !isPublicStatus) {
      return res.status(403).json({
        status: false,
        message: 'Access denied. You must be the owner or enrolled to view this workshop.'
      });
    }

    // Add enrollment info to response so frontend knows the user's role in this workshop
    const workshopData = workshop.toObject();
    if (enrollment) {
      workshopData.userEnrollment = {
        role: enrollment.role,
        status: enrollment.status
      };
    }

    return res.status(200).json({
      status: true,
      message: 'Workshop fetched successfully',
      data: workshopData
    });
  } catch (error) {
    console.error('Get Workshop Error:', error);
    return res.status(500).json({ status: false, message: 'Failed to fetch workshop' });
  }
};

module.exports = getWorkshop;
