const { Course } = require('../../models/authModels');

/**
 * Update an existing course
 * PUT /api/teacher/courses/:id
 * Only course owner can update, and only in Draft/Rejected status
 */
const updateCourse = async (req, res) => {
  try {
    const course = req.course; // Attached by verifyCourseOwnership middleware

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

    // Fields that can be updated
    const allowedUpdates = {
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
    };

    // Filter out undefined values
    const updates = {};
    for (const [key, value] of Object.entries(allowedUpdates)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    // Validate price for paid courses
    if (updates.pricingType === 'Paid' || (course.pricingType === 'Paid' && updates.pricingType === undefined)) {
      const newPrice = updates.price !== undefined ? updates.price : course.price;
      if (!newPrice || newPrice <= 0) {
        return res.status(400).json({
          status: false,
          message: 'Price is required for paid courses and must be greater than 0'
        });
      }
    }

    // If switching to free, set price to 0
    if (updates.pricingType === 'Free') {
      updates.price = 0;
    }

    // Apply updates
    Object.assign(course, updates);

    // If course was rejected and is being updated, keep it in Draft
    if (course.courseStatus === 'Rejected') {
      course.courseStatus = 'Draft';
      course.rejectionReason = undefined;
    }

    await course.save();

    return res.status(200).json({
      status: true,
      message: 'Course updated successfully',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        courseStatus: course.courseStatus,
        category: course.category,
        level: course.level,
        pricingType: course.pricingType,
        price: course.price,
        duration: course.duration,
        totalModules: course.totalModules,
        totalLessons: course.totalLessons,
        thumbnailUrl: course.thumbnailUrl,
        updatedAt: course.updatedAt
      }
    });

  } catch (error) {
    console.error('Update Course Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        status: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      status: false,
      message: 'Failed to update course'
    });
  }
};

/**
 * Add or update syllabus module
 * PUT /api/teacher/courses/:id/modules
 */
const updateSyllabus = async (req, res) => {
  try {
    const course = req.course;
    const { modules } = req.body;

    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({
        status: false,
        message: 'Modules array is required'
      });
    }

    // Validate modules
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      if (!module.moduleTitle) {
        return res.status(400).json({
          status: false,
          message: `Module ${i + 1} requires a title`
        });
      }
      module.moduleOrder = i + 1;

      // Validate lessons if present
      if (module.lessons && Array.isArray(module.lessons)) {
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j];
          if (!lesson.lessonTitle || !lesson.lessonType) {
            return res.status(400).json({
              status: false,
              message: `Lesson ${j + 1} in Module ${i + 1} requires title and type`
            });
          }
          lesson.lessonOrder = j + 1;
        }
      }
    }

    course.syllabus = modules;
    await course.save();

    return res.status(200).json({
      status: true,
      message: 'Syllabus updated successfully',
      syllabus: course.syllabus,
      totalModules: course.totalModules,
      totalLessons: course.totalLessons,
      duration: course.duration
    });

  } catch (error) {
    console.error('Update Syllabus Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to update syllabus'
    });
  }
};

module.exports = { updateCourse, updateSyllabus };
