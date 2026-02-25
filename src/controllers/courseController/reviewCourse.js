const { Course, User } = require('../../models/authModels');

/**
 * Get courses pending review (Admin)
 * GET /api/admin/courses/pending
 */
const getPendingCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'submittedAt',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      courseStatus: { $in: ['Submitted', 'UnderReview'] }
    };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const courses = await Course.find(filter)
      .select('courseTitle courseSlug category level pricingType price thumbnailUrl submittedAt courseStatus')
      .populate('teacherId', 'name email profileImage')
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const totalCourses = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / limitNum);

    // Get counts by status
    const submittedCount = await Course.countDocuments({ courseStatus: 'Submitted' });
    const underReviewCount = await Course.countDocuments({ courseStatus: 'UnderReview' });

    return res.status(200).json({
      status: true,
      courses: courses.map(course => ({
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        category: course.category,
        level: course.level,
        pricingType: course.pricingType,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
        courseStatus: course.courseStatus,
        submittedAt: course.submittedAt,
        teacher: course.teacherId ? {
          _id: course.teacherId._id,
          name: course.teacherId.name,
          email: course.teacherId.email,
          profileImage: course.teacherId.profileImage
        } : null
      })),
      pagination: {
        totalCourses,
        currentPage: pageNum,
        totalPages,
        pageSize: limitNum
      },
      summary: {
        submitted: submittedCount,
        underReview: underReviewCount
      }
    });

  } catch (error) {
    console.error('Get Pending Courses Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch pending courses'
    });
  }
};

/**
 * Get course details for review (Admin)
 * GET /api/admin/courses/:id/review
 */
const getCourseForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('teacherId', 'name email phone profileImage teacherProfile verificationStatus');

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    return res.status(200).json({
      status: true,
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        courseDescription: course.courseDescription,
        shortDescription: course.shortDescription,
        category: course.category,
        subCategory: course.subCategory,
        level: course.level,
        language: course.language,
        duration: course.duration,
        syllabus: course.syllabus,
        prerequisites: course.prerequisites,
        learningOutcomes: course.learningOutcomes,
        targetAudience: course.targetAudience,
        pricingType: course.pricingType,
        price: course.price,
        currency: course.currency,
        discount: course.discount,
        thumbnailUrl: course.thumbnailUrl,
        introVideoUrl: course.introVideoUrl,
        bannerUrl: course.bannerUrl,
        maxStudents: course.maxStudents,
        tags: course.tags,
        courseStatus: course.courseStatus,
        submittedAt: course.submittedAt,
        reviewHistory: course.reviewHistory,
        totalModules: course.totalModules,
        totalLessons: course.totalLessons,
        certificateEnabled: course.certificateEnabled,
        createdAt: course.createdAt,
        teacher: course.teacherId ? {
          _id: course.teacherId._id,
          name: course.teacherId.name,
          email: course.teacherId.email,
          phone: course.teacherId.phone,
          profileImage: course.teacherId.profileImage,
          bio: course.teacherId.teacherProfile?.bio,
          qualification: course.teacherId.teacherProfile?.qualification,
          expertise: course.teacherId.teacherProfile?.expertise,
          experience: course.teacherId.teacherProfile?.experience,
          totalCourses: course.teacherId.teacherProfile?.totalCourses,
          averageRating: course.teacherId.teacherProfile?.averageRating,
          verificationStatus: course.teacherId.verificationStatus
        } : null
      }
    });

  } catch (error) {
    console.error('Get Course For Review Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch course details'
    });
  }
};

/**
 * Start reviewing a course (Admin)
 * POST /api/admin/courses/:id/start-review
 * Moves course from Submitted to UnderReview
 */
const startReview = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    if (course.courseStatus !== 'Submitted') {
      return res.status(400).json({
        status: false,
        message: `Cannot start review. Current status: ${course.courseStatus}`
      });
    }

    course.courseStatus = 'UnderReview';
    await course.save();

    return res.status(200).json({
      status: true,
      message: 'Review started',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus
      }
    });

  } catch (error) {
    console.error('Start Review Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to start review'
    });
  }
};

/**
 * Approve a course (Admin)
 * POST /api/admin/courses/:id/approve
 */
const approveCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const admin = req.admin;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    if (course.courseStatus !== 'Submitted' && course.courseStatus !== 'UnderReview') {
      return res.status(400).json({
        status: false,
        message: `Cannot approve course. Current status: ${course.courseStatus}`
      });
    }

    await course.approve(admin._id, 'Admin', remarks || 'Course approved');

    // Notify teacher (you can add notification logic here)

    return res.status(200).json({
      status: true,
      message: 'Course approved successfully. Teacher can now publish it.',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        lastReviewedBy: course.lastReviewedBy
      }
    });

  } catch (error) {
    console.error('Approve Course Error:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to approve course'
    });
  }
};

/**
 * Reject a course (Admin)
 * POST /api/admin/courses/:id/reject
 */
const rejectCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, remarks } = req.body;
    const admin = req.admin;

    if (!reason) {
      return res.status(400).json({
        status: false,
        message: 'Rejection reason is required'
      });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    if (course.courseStatus !== 'Submitted' && course.courseStatus !== 'UnderReview') {
      return res.status(400).json({
        status: false,
        message: `Cannot reject course. Current status: ${course.courseStatus}`
      });
    }

    await course.reject(admin._id, 'Admin', reason);

    // Notify teacher (you can add notification logic here)

    return res.status(200).json({
      status: true,
      message: 'Course rejected. Teacher has been notified.',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        rejectionReason: course.rejectionReason,
        lastReviewedBy: course.lastReviewedBy
      }
    });

  } catch (error) {
    console.error('Reject Course Error:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to reject course'
    });
  }
};

/**
 * Request changes on a course (Admin)
 * POST /api/admin/courses/:id/request-changes
 */
const requestChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { changes, remarks } = req.body;
    const admin = req.admin;

    if (!changes || changes.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Please specify the changes required'
      });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    if (course.courseStatus !== 'Submitted' && course.courseStatus !== 'UnderReview') {
      return res.status(400).json({
        status: false,
        message: `Cannot request changes. Current status: ${course.courseStatus}`
      });
    }

    const review = {
      reviewerId: admin._id,
      reviewerRole: 'Admin',
      reviewedAt: new Date(),
      remarks: `Changes requested: ${changes.join(', ')}. ${remarks || ''}`,
      action: 'RequestChanges'
    };

    course.reviewHistory.push(review);
    course.lastReviewedBy = review;
    course.courseStatus = 'Rejected';
    course.rejectionReason = `Changes required: ${changes.join(', ')}`;

    await course.save();

    return res.status(200).json({
      status: true,
      message: 'Change request sent to teacher.',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        lastReviewedBy: course.lastReviewedBy
      }
    });

  } catch (error) {
    console.error('Request Changes Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to request changes'
    });
  }
};

/**
 * Feature/unfeature a course (Admin)
 * POST /api/admin/courses/:id/feature
 */
const toggleFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    if (course.courseStatus !== 'Published') {
      return res.status(400).json({
        status: false,
        message: 'Only published courses can be featured'
      });
    }

    course.isFeatured = featured !== undefined ? featured : !course.isFeatured;
    await course.save();

    return res.status(200).json({
      status: true,
      message: course.isFeatured ? 'Course is now featured' : 'Course removed from featured',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        isFeatured: course.isFeatured
      }
    });

  } catch (error) {
    console.error('Toggle Feature Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to update course'
    });
  }
};

/**
 * Get all courses (Admin)
 * GET /api/admin/courses
 */
const getAllCoursesAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      teacherId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.courseStatus = status;
    if (category) filter.category = category;
    if (teacherId) filter.teacherId = teacherId;
    if (search) {
      filter.$or = [
        { courseTitle: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const courses = await Course.find(filter)
      .select('courseTitle courseSlug category level pricingType price courseStatus enrolledCount rating isFeatured isActive createdAt')
      .populate('teacherId', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const totalCourses = await Course.countDocuments(filter);

    // Get status summary
    const statusSummary = await Course.aggregate([
      { $group: { _id: '$courseStatus', count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      status: true,
      courses,
      pagination: {
        totalCourses,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCourses / limitNum),
        pageSize: limitNum
      },
      statusSummary: statusSummary.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get All Courses Admin Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch courses'
    });
  }
};

module.exports = {
  getPendingCourses,
  getCourseForReview,
  startReview,
  approveCourse,
  rejectCourse,
  requestChanges,
  toggleFeature,
  getAllCoursesAdmin
};
