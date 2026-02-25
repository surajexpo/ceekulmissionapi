const teacherRoute = require("express").Router();
const {
  createCourse,
  updateCourse,
  updateSyllabus,
  getCourseForTeacher,
  getTeacherCourses,
  deleteCourse,
  archiveCourse,
  restoreCourse,
  submitForReview,
  publishCourse,
  unpublishCourse,
  withdrawFromReview,
  cloneCourse,
} = require("../controllers/courseController");
const {
  authenticateTeacher,
  verifyCourseOwnership,
  verifyCourseEditable,
  fileUploader,
} = require("../middlewares");

// ==================== COURSE MANAGEMENT ====================

/**
 * @route   POST /api/teacher/courses
 * @desc    Create a new course
 * @access  Teacher (verified)
 */
teacherRoute.post("/courses", authenticateTeacher, createCourse);
// teacherRoute.post("/courses",  createCourse);

/**
 * @route   GET /api/teacher/courses
 * @desc    Get all courses by logged-in teacher
 * @access  Teacher (verified)
 */
teacherRoute.get("/courses", authenticateTeacher, getTeacherCourses);

/**
 * @route   GET /api/teacher/courses/:id
 * @desc    Get single course details (full access for owner)
 * @access  Teacher (verified) - owner only
 */
teacherRoute.get(
  "/courses/:id",
  authenticateTeacher,
  verifyCourseOwnership,
  getCourseForTeacher,
);

/**
 * @route   PUT /api/teacher/courses/:id
 * @desc    Update course details
 * @access  Teacher (verified) - owner only, Draft/Rejected status only
 */
teacherRoute.put(
  "/courses/:id",
  authenticateTeacher,
  verifyCourseOwnership,
  verifyCourseEditable,
  updateCourse,
);

/**
 * @route   PUT /api/teacher/courses/:id/syllabus
 * @desc    Update course syllabus (modules and lessons)
 * @access  Teacher (verified) - owner only, Draft/Rejected status only
 */
teacherRoute.put(
  "/courses/:id/syllabus",
  authenticateTeacher,
  verifyCourseOwnership,
  verifyCourseEditable,
  updateSyllabus,
);

/**
 * @route   DELETE /api/teacher/courses/:id
 * @desc    Delete a course (only Draft/Rejected, no enrollments)
 * @access  Teacher (verified) - owner only
 */
teacherRoute.delete(
  "/courses/:id",
  authenticateTeacher,
  verifyCourseOwnership,
  deleteCourse,
);

// ==================== COURSE LIFECYCLE ACTIONS ====================

/**
 * @route   POST /api/teacher/courses/:id/submit
 * @desc    Submit course for admin review
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/submit",
  authenticateTeacher,
  verifyCourseOwnership,
  submitForReview,
);

/**
 * @route   POST /api/teacher/courses/:id/withdraw
 * @desc    Withdraw course from review queue
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/withdraw",
  authenticateTeacher,
  verifyCourseOwnership,
  withdrawFromReview,
);

/**
 * @route   POST /api/teacher/courses/:id/publish
 * @desc    Publish an approved course
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/publish",
  authenticateTeacher,
  verifyCourseOwnership,
  publishCourse,
);

/**
 * @route   POST /api/teacher/courses/:id/unpublish
 * @desc    Unpublish a published course
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/unpublish",
  authenticateTeacher,
  verifyCourseOwnership,
  unpublishCourse,
);

/**
 * @route   POST /api/teacher/courses/:id/archive
 * @desc    Archive a course (soft delete)
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/archive",
  authenticateTeacher,
  verifyCourseOwnership,
  archiveCourse,
);

/**
 * @route   POST /api/teacher/courses/:id/restore
 * @desc    Restore an archived course
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/restore",
  authenticateTeacher,
  verifyCourseOwnership,
  restoreCourse,
);

/**
 * @route   POST /api/teacher/courses/:id/clone
 * @desc    Clone/duplicate a course
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/clone",
  authenticateTeacher,
  verifyCourseOwnership,
  cloneCourse,
);

// ==================== MEDIA UPLOAD ====================

/**
 * @route   POST /api/teacher/courses/:id/thumbnail
 * @desc    Upload course thumbnail
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/thumbnail",
  authenticateTeacher,
  verifyCourseOwnership,
  verifyCourseEditable,
  fileUploader([{ name: "thumbnail", maxCount: 1 }], "Courses/Thumbnails"),
  async (req, res) => {
    try {
      const course = req.course;

      if (!req.files || !req.files.thumbnail) {
        return res.status(400).json({
          status: false,
          message: "Thumbnail file is required",
        });
      }

      course.thumbnailUrl = `/public/Courses/Thumbnails/${req.files.thumbnail[0].filename}`;
      await course.save();

      return res.status(200).json({
        status: true,
        message: "Thumbnail uploaded successfully",
        thumbnailUrl: course.thumbnailUrl,
      });
    } catch (error) {
      console.error("Upload Thumbnail Error:", error);
      return res.status(500).json({
        status: false,
        message: "Failed to upload thumbnail",
      });
    }
  },
);

/**
 * @route   POST /api/teacher/courses/:id/intro-video
 * @desc    Upload course intro video
 * @access  Teacher (verified) - owner only
 */
teacherRoute.post(
  "/courses/:id/intro-video",
  authenticateTeacher,
  verifyCourseOwnership,
  verifyCourseEditable,
  fileUploader([{ name: "video", maxCount: 1 }], "Courses/Videos"),
  async (req, res) => {
    try {
      const course = req.course;

      if (!req.files || !req.files.video) {
        return res.status(400).json({
          status: false,
          message: "Video file is required",
        });
      }

      course.introVideoUrl = `/public/Courses/Videos/${req.files.video[0].filename}`;
      await course.save();

      return res.status(200).json({
        status: true,
        message: "Intro video uploaded successfully",
        introVideoUrl: course.introVideoUrl,
      });
    } catch (error) {
      console.error("Upload Intro Video Error:", error);
      return res.status(500).json({
        status: false,
        message: "Failed to upload intro video",
      });
    }
  },
);

module.exports = teacherRoute;
