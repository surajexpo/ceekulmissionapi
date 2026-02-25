const { Course, User } = require('../../models/authModels');

/**
 * Get single course by ID or slug
 * GET /api/courses/:idOrSlug
 * Public endpoint - returns published courses
 */
const getCoursePublic = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    let course;

    // Check if it's a valid ObjectId
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findOne({
        _id: idOrSlug,
        courseStatus: 'Published',
        isActive: true
      }).populate('teacherId', 'name profileImage teacherProfile.bio teacherProfile.averageRating teacherProfile.totalStudents');
    } else {
      // Search by slug
      course = await Course.findOne({
        courseSlug: idOrSlug,
        courseStatus: 'Published',
        isActive: true
      }).populate('teacherId', 'name profileImage teacherProfile.bio teacherProfile.averageRating teacherProfile.totalStudents');
    }

    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    // Increment view count
    course.viewCount += 1;
    await course.save();

    // Format response
    const courseData = {
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
      syllabus: course.syllabus.map(module => ({
        moduleTitle: module.moduleTitle,
        moduleOrder: module.moduleOrder,
        moduleDescription: module.moduleDescription,
        lessons: module.lessons.map(lesson => ({
          lessonTitle: lesson.lessonTitle,
          lessonType: lesson.lessonType,
          duration: lesson.duration,
          isPreview: lesson.isPreview,
          // Only include resourceUrl for preview lessons
          resourceUrl: lesson.isPreview ? lesson.resourceUrl : undefined
        }))
      })),
      prerequisites: course.prerequisites,
      learningOutcomes: course.learningOutcomes,
      targetAudience: course.targetAudience,
      pricingType: course.pricingType,
      price: course.price,
      effectivePrice: course.getEffectivePrice(),
      currency: course.currency,
      discount: course.discount,
      thumbnailUrl: course.thumbnailUrl,
      introVideoUrl: course.introVideoUrl,
      bannerUrl: course.bannerUrl,
      enrolledCount: course.enrolledCount,
      rating: course.rating,
      ratingCount: course.ratingCount,
      ratingBreakdown: course.ratingBreakdown,
      tags: course.tags,
      totalModules: course.totalModules,
      totalLessons: course.totalLessons,
      isEnrollable: course.isEnrollable,
      certificateEnabled: course.certificateEnabled,
      publishedAt: course.publishedAt,
      teacher: course.teacherId ? {
        _id: course.teacherId._id,
        name: course.teacherId.name,
        profileImage: course.teacherId.profileImage,
        bio: course.teacherId.teacherProfile?.bio,
        averageRating: course.teacherId.teacherProfile?.averageRating,
        totalStudents: course.teacherId.teacherProfile?.totalStudents
      } : null
    };

    return res.status(200).json({
      status: true,
      course: courseData
    });

  } catch (error) {
    console.error('Get Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch course'
    });
  }
};

/**
 * Get course for teacher (includes all details)
 * GET /api/teacher/courses/:id
 */
const getCourseForTeacher = async (req, res) => {
  try {
    const course = req.course; // Attached by verifyCourseOwnership middleware

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
        revenueShare: course.revenueShare,
        thumbnailUrl: course.thumbnailUrl,
        introVideoUrl: course.introVideoUrl,
        bannerUrl: course.bannerUrl,
        maxStudents: course.maxStudents,
        enrolledCount: course.enrolledCount,
        completionCount: course.completionCount,
        courseStatus: course.courseStatus,
        rejectionReason: course.rejectionReason,
        lastReviewedBy: course.lastReviewedBy,
        rating: course.rating,
        ratingCount: course.ratingCount,
        ratingBreakdown: course.ratingBreakdown,
        viewCount: course.viewCount,
        wishlistCount: course.wishlistCount,
        tags: course.tags,
        totalModules: course.totalModules,
        totalLessons: course.totalLessons,
        isActive: course.isActive,
        isFeatured: course.isFeatured,
        certificateEnabled: course.certificateEnabled,
        version: course.version,
        publishedAt: course.publishedAt,
        submittedAt: course.submittedAt,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }
    });

  } catch (error) {
    console.error('Get Course For Teacher Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch course'
    });
  }
};

/**
 * Get all courses by teacher
 * GET /api/teacher/courses
 */
const getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { teacherId };
    if (status) {
      filter.courseStatus = status;
    }

    // Build sort
    const sortOptions = {};
    const validSortFields = ['createdAt', 'updatedAt', 'courseTitle', 'enrolledCount', 'rating'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const courses = await Course.find(filter)
      .select('courseTitle courseSlug courseStatus category level pricingType price thumbnailUrl enrolledCount rating ratingCount duration createdAt updatedAt')
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const totalCourses = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / limitNum);

    // Get status counts
    const statusCounts = await Course.aggregate([
      { $match: { teacherId: teacherId } },
      { $group: { _id: '$courseStatus', count: { $sum: 1 } } }
    ]);

    const statusSummary = {};
    statusCounts.forEach(item => {
      statusSummary[item._id] = item.count;
    });

    return res.status(200).json({
      status: true,
      courses: courses.map(course => ({
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        courseStatus: course.courseStatus,
        category: course.category,
        level: course.level,
        pricingType: course.pricingType,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
        enrolledCount: course.enrolledCount,
        rating: course.rating,
        ratingCount: course.ratingCount,
        duration: course.duration,
        totalModules: course.totalModules,
        totalLessons: course.totalLessons,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      })),
      pagination: {
        totalCourses,
        currentPage: pageNum,
        totalPages,
        pageSize: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      statusSummary
    });

  } catch (error) {
    console.error('Get Teacher Courses Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch courses'
    });
  }
};

/**
 * Get all published courses (public listing)
 * GET /api/courses
 */
const getPublishedCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subCategory,
      level,
      pricingType,
      minPrice,
      maxPrice,
      minRating,
      language,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {
      courseStatus: 'Published',
      isActive: true
    };

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (level) filter.level = level;
    if (pricingType) filter.pricingType = pricingType;
    if (language) filter.language = language;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    const sortOptions = {};
    const validSortFields = ['publishedAt', 'rating', 'enrolledCount', 'price', 'createdAt'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.publishedAt = -1;
    }

    const courses = await Course.find(filter)
      .select('courseTitle courseSlug shortDescription category level pricingType price currency discount thumbnailUrl enrolledCount rating ratingCount duration language tags')
      .populate('teacherId', 'name profileImage')
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const totalCourses = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / limitNum);

    return res.status(200).json({
      status: true,
      courses: courses.map(course => ({
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        shortDescription: course.shortDescription,
        category: course.category,
        level: course.level,
        pricingType: course.pricingType,
        price: course.price,
        effectivePrice: course.getEffectivePrice(),
        currency: course.currency,
        hasDiscount: course.discount?.isActive && new Date() <= course.discount?.validTill,
        thumbnailUrl: course.thumbnailUrl,
        enrolledCount: course.enrolledCount,
        rating: course.rating,
        ratingCount: course.ratingCount,
        duration: course.duration,
        language: course.language,
        totalLessons: course.totalLessons,
        teacher: course.teacherId ? {
          name: course.teacherId.name,
          profileImage: course.teacherId.profileImage
        } : null
      })),
      pagination: {
        totalCourses,
        currentPage: pageNum,
        totalPages,
        pageSize: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get Published Courses Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch courses'
    });
  }
};

/**
 * Get featured courses
 * GET /api/courses/featured
 */
const getFeaturedCourses = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const courses = await Course.find({
      courseStatus: 'Published',
      isActive: true,
      isFeatured: true
    })
      .select('courseTitle courseSlug shortDescription category level pricingType price currency discount thumbnailUrl enrolledCount rating ratingCount duration')
      .populate('teacherId', 'name profileImage')
      .limit(parseInt(limit))
      .sort({ rating: -1, enrolledCount: -1 });

    return res.status(200).json({
      status: true,
      courses: courses.map(course => ({
        _id: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        shortDescription: course.shortDescription,
        category: course.category,
        level: course.level,
        pricingType: course.pricingType,
        price: course.price,
        effectivePrice: course.getEffectivePrice(),
        currency: course.currency,
        thumbnailUrl: course.thumbnailUrl,
        enrolledCount: course.enrolledCount,
        rating: course.rating,
        ratingCount: course.ratingCount,
        duration: course.duration,
        teacher: course.teacherId ? {
          name: course.teacherId.name,
          profileImage: course.teacherId.profileImage
        } : null
      }))
    });

  } catch (error) {
    console.error('Get Featured Courses Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch featured courses'
    });
  }
};

/**
 * Get courses by category
 * GET /api/courses/category/:category
 */
const getCoursesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, subCategory } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      category,
      courseStatus: 'Published',
      isActive: true
    };

    if (subCategory) filter.subCategory = subCategory;

    const courses = await Course.find(filter)
      .select('courseTitle courseSlug shortDescription level pricingType price currency thumbnailUrl enrolledCount rating ratingCount duration')
      .populate('teacherId', 'name profileImage')
      .skip(skip)
      .limit(limitNum)
      .sort({ rating: -1, enrolledCount: -1 });

    const totalCourses = await Course.countDocuments(filter);

    return res.status(200).json({
      status: true,
      category,
      courses,
      pagination: {
        totalCourses,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCourses / limitNum),
        pageSize: limitNum
      }
    });

  } catch (error) {
    console.error('Get Courses By Category Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch courses'
    });
  }
};

module.exports = {
  getCoursePublic,
  getCourseForTeacher,
  getTeacherCourses,
  getPublishedCourses,
  getFeaturedCourses,
  getCoursesByCategory
};
