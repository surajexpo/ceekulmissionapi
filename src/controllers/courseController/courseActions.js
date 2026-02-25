const { Course, User } = require('../../models/authModels');

/**
 * Submit course for review
 * POST /api/teacher/courses/:id/submit
 * Moves course from Draft/Rejected to Submitted status
 */
const submitForReview = async (req, res) => {
  try {
    const course = req.course;

    // Validate course status
    if (course.courseStatus !== 'Draft' && course.courseStatus !== 'Rejected') {
      return res.status(400).json({
        status: false,
        message: `Cannot submit course. Current status: ${course.courseStatus}. Only Draft or Rejected courses can be submitted.`
      });
    }

    // Validate minimum requirements
    const validationErrors = [];

    if (!course.courseTitle || course.courseTitle.trim().length === 0) {
      validationErrors.push('Course title is required');
    }

    if (!course.courseDescription || course.courseDescription.trim().length < 100) {
      validationErrors.push('Course description must be at least 100 characters');
    }

    if (!course.category) {
      validationErrors.push('Category is required');
    }

    if (!course.level) {
      validationErrors.push('Level is required');
    }

    if (!course.thumbnailUrl) {
      validationErrors.push('Thumbnail is required');
    }

    if (!course.syllabus || course.syllabus.length === 0) {
      validationErrors.push('Course must have at least one module');
    }

    // Check for lessons
    const totalLessons = course.syllabus?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
    if (totalLessons === 0) {
      validationErrors.push('Course must have at least one lesson');
    }

    // Check if paid course has price
    if (course.pricingType === 'Paid' && (!course.price || course.price <= 0)) {
      validationErrors.push('Paid courses must have a valid price');
    }

    // Check for at least one preview lesson
    const hasPreview = course.syllabus?.some(mod =>
      mod.lessons?.some(lesson => lesson.isPreview)
    );
    if (!hasPreview) {
      validationErrors.push('Course must have at least one preview lesson');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Course does not meet submission requirements',
        errors: validationErrors
      });
    }

    // Submit course
    course.courseStatus = 'Submitted';
    course.submittedAt = new Date();
    await course.save();

    return res.status(200).json({
      status: true,
      message: 'Course submitted for review successfully',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        submittedAt: course.submittedAt
      }
    });

  } catch (error) {
    console.error('Submit Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to submit course for review'
    });
  }
};

/**
 * Publish an approved course
 * POST /api/teacher/courses/:id/publish
 */
const publishCourse = async (req, res) => {
  try {
    const course = req.course;

    if (course.courseStatus !== 'Approved') {
      return res.status(400).json({
        status: false,
        message: `Cannot publish course. Current status: ${course.courseStatus}. Only approved courses can be published.`
      });
    }

    await course.publish();

    return res.status(200).json({
      status: true,
      message: 'Course published successfully! It is now visible to students.',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        courseStatus: course.courseStatus,
        publishedAt: course.publishedAt
      }
    });

  } catch (error) {
    console.error('Publish Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to publish course'
    });
  }
};

/**
 * Unpublish a published course
 * POST /api/teacher/courses/:id/unpublish
 */
const unpublishCourse = async (req, res) => {
  try {
    const course = req.course;

    if (course.courseStatus !== 'Published') {
      return res.status(400).json({
        status: false,
        message: `Cannot unpublish course. Current status: ${course.courseStatus}.`
      });
    }

    await course.unpublish();

    return res.status(200).json({
      status: true,
      message: 'Course unpublished successfully. It is no longer visible to students.',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        isActive: course.isActive
      }
    });

  } catch (error) {
    console.error('Unpublish Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to unpublish course'
    });
  }
};

/**
 * Withdraw course from review
 * POST /api/teacher/courses/:id/withdraw
 * Moves course back to Draft status
 */
const withdrawFromReview = async (req, res) => {
  try {
    const course = req.course;

    if (course.courseStatus !== 'Submitted' && course.courseStatus !== 'UnderReview') {
      return res.status(400).json({
        status: false,
        message: `Cannot withdraw course. Current status: ${course.courseStatus}.`
      });
    }

    course.courseStatus = 'Draft';
    await course.save();

    return res.status(200).json({
      status: true,
      message: 'Course withdrawn from review. It is now back in Draft status.',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus
      }
    });

  } catch (error) {
    console.error('Withdraw Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to withdraw course'
    });
  }
};

/**
 * Clone/duplicate a course
 * POST /api/teacher/courses/:id/clone
 */
const cloneCourse = async (req, res) => {
  try {
    const course = req.course;
    const teacherId = req.user._id;

    // Create a copy of the course
    const courseData = course.toObject();

    // Remove fields that should be unique/reset
    delete courseData._id;
    delete courseData.courseSlug;
    delete courseData.createdAt;
    delete courseData.updatedAt;
    delete courseData.publishedAt;
    delete courseData.submittedAt;
    delete courseData.reviewHistory;
    delete courseData.lastReviewedBy;
    delete courseData.rejectionReason;

    // Reset counters
    courseData.enrolledCount = 0;
    courseData.completionCount = 0;
    courseData.rating = 0;
    courseData.ratingCount = 0;
    courseData.ratingBreakdown = { five: 0, four: 0, three: 0, two: 0, one: 0 };
    courseData.viewCount = 0;
    courseData.wishlistCount = 0;

    // Set new values
    courseData.courseTitle = `${course.courseTitle} (Copy)`;
    courseData.courseStatus = 'Draft';
    courseData.isActive = true;
    courseData.isFeatured = false;
    courseData.version = 1;
    courseData.teacherId = teacherId;
    courseData.createdBy = teacherId;

    const newCourse = new Course(courseData);
    await newCourse.save();

    // Update teacher's course count
    await User.findByIdAndUpdate(teacherId, {
      $inc: { 'teacherProfile.totalCourses': 1 }
    });

    return res.status(201).json({
      status: true,
      message: 'Course cloned successfully',
      course: {
        _id: newCourse._id,
        courseTitle: newCourse.courseTitle,
        courseSlug: newCourse.courseSlug,
        courseStatus: newCourse.courseStatus
      }
    });

  } catch (error) {
    console.error('Clone Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to clone course'
    });
  }
};

module.exports = {
  submitForReview,
  publishCourse,
  unpublishCourse,
  withdrawFromReview,
  cloneCourse
};
