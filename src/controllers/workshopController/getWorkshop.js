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

    // Ownership check
    if (workshop.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: false, message: 'Access denied. You can only view your own workshops.' });
    }

    return res.status(200).json({
      status: true,
      message: 'Workshop fetched successfully',
      data: workshop
    });
  } catch (error) {
    console.error('Get Workshop Error:', error);
    return res.status(500).json({ status: false, message: 'Failed to fetch workshop' });
  }
};

module.exports = getWorkshop;
