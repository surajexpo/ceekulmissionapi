const Workshop = require('../../models/workshopModel');
const mongoose = require('mongoose');

/**
 * Cancel a workshop (soft delete — sets status to 'cancelled')
 * PATCH /api/v1/workshops/:id/cancel
 * @access Teacher (verified) — owner only
 */
const cancelWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: 'Invalid workshop ID' });
    }

    const workshop = await Workshop.findById(id);

    if (!workshop) {
      return res.status(404).json({ status: false, message: 'Workshop not found' });
    }

    const { Enrollment } = require('../../models/authModels');
    const enrollment = await Enrollment.findOne({ workshopId: id, userId: req.user._id });

    if (!enrollment || enrollment.role !== 'Expert') {
      return res.status(403).json({
        status: false,
        message: 'Access denied. Only the Expert (owner) can cancel this workshop.'
      });
    }

    if (workshop.status === 'cancelled') {
      return res.status(400).json({ status: false, message: 'Workshop is already cancelled' });
    }

    workshop.status = 'cancelled';
    await workshop.save();

    return res.status(200).json({
      status: true,
      message: 'Workshop cancelled successfully',
      data: {
        _id: workshop._id,
        workshopTitle: workshop.workshopTitle,
        status: workshop.status
      }
    });
  } catch (error) {
    console.error('Cancel Workshop Error:', error);
    return res.status(500).json({ status: false, message: 'Failed to cancel workshop' });
  }
};

module.exports = cancelWorkshop;
