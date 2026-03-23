const Workshop = require('../../models/workshopModel');

/**
 * Get all workshops created by the authenticated teacher
 * GET /api/v1/workshops/my
 * @access Teacher (verified)
 */
const getMyWorkshops = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Find workshops created by the user OR where the user is an enrolled Instructor
    const { Enrollment } = require('../../models/authModels');
    const enrolledIds = await Enrollment.find({
      userId: req.user._id,
      role: 'Instructor'
    }).distinct('workshopId');

    const filter = {
      $or: [
        { createdBy: req.user._id },
        { _id: { $in: enrolledIds } }
      ]
    };
    if (status) {
      const allowed = ['draft', 'published', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid status filter. Must be draft, published, or cancelled'
        });
      }
      filter.status = status;
    }

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
      message: 'Workshops fetched successfully',
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
    console.error('Get My Workshops Error:', error);
    return res.status(500).json({ status: false, message: 'Failed to fetch workshops' });
  }
};

module.exports = getMyWorkshops;
