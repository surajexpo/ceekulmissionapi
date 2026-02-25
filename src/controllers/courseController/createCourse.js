const { Course, User } = require('../../models/authModels');

/**
 * Create a new course
 * POST /api/teacher/courses
 * Only verified teachers can create courses
 */
const createCourse = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const {
      courseTitle,
      courseDescription,
      shortDescription,
      category,
      subCategory,
      level,
      language,
      duration,
      syllabus,
      prerequisites,
      learningOutcomes,
      targetAudience,
      pricingType,
      price,
      currency,
      discount,
      thumbnailUrl,
      introVideoUrl,
      bannerUrl,
      maxStudents,
      tags,
      certificateEnabled
    } = req.body;

    // Validate required fields
    const requiredFields = ['courseTitle', 'courseDescription', 'category', 'level', 'pricingType', 'thumbnailUrl'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          status: false,
          message: `${field} is required`
        });
      }
    }

    // Validate price for paid courses
    if (pricingType === 'Paid' && (!price || price <= 0)) {
      return res.status(400).json({
        status: false,
        message: 'Price is required for paid courses and must be greater than 0'
      });
    }

    // Create course
    const course = new Course({
      teacherId,
      createdBy: teacherId,
      courseTitle: courseTitle.trim(),
      courseDescription,
      shortDescription,
      category,
      subCategory,
      level,
      language: language || 'English',
      duration: duration || 0,
      syllabus: syllabus || [],
      prerequisites: prerequisites || [],
      learningOutcomes: learningOutcomes || [],
      targetAudience: targetAudience || [],
      pricingType,
      price: pricingType === 'Paid' ? price : 0,
      currency: currency || 'Neutron',
      discount,
      thumbnailUrl,
      introVideoUrl,
      bannerUrl,
      maxStudents,
      tags: tags || [],
      certificateEnabled: certificateEnabled || false,
      courseStatus: 'Draft'
    });

    await course.save();

    // Update teacher's total courses count
    await User.findByIdAndUpdate(teacherId, {
      $inc: { 'teacherProfile.totalCourses': 1 }
    });

    return res.status(201).json({
      status: true,
      message: 'Course created successfully',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        courseStatus: course.courseStatus,
        category: course.category,
        level: course.level,
        pricingType: course.pricingType,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
        createdAt: course.createdAt
      }
    });

  } catch (error) {
    console.error('Create Course Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        status: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: 'A course with this title already exists'
      });
    }

    return res.status(500).json({
      status: false,
      message: 'Failed to create course'
    });
  }
};

module.exports = createCourse;
