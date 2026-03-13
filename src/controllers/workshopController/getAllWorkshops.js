const Workshop = require('../../models/workshopModel');

/**
 * Get all public workshops
 * GET /api/v1/workshops
 * @access Public
 */
const getAllWorkshops = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // For public view, we show published and draft workshops (including drafts for testing)
    const filter = { status: { $in: ['published', 'draft'] } };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [workshops, total] = await Promise.all([
      Workshop.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-__v'),
      Workshop.countDocuments(filter)
    ]);

    return res.status(200).json({
      status: true,
      message: 'Public workshops fetched successfully',
      data: {
        workshops,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    console.error('Get All Workshops Error:', error);
    return res.status(500).json({ status: false, message: 'Failed to fetch public workshops' });
  }
};

module.exports = getAllWorkshops;
