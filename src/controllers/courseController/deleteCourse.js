const { Course, User } = require('../../models/authModels');

/**
 * Delete a course
 * DELETE /api/teacher/courses/:id
 * Only course owner can delete
 * Published courses cannot be deleted, only archived
 */
const deleteCourse = async (req, res) => {
  try {
    const course = req.course; // Attached by verifyCourseOwnership middleware
    const teacherId = req.user._id;

    // Check if course can be deleted
    const nonDeletableStatuses = ['Published', 'Approved'];

    if (nonDeletableStatuses.includes(course.courseStatus)) {
      return res.status(403).json({
        status: false,
        message: `Cannot delete a ${course.courseStatus.toLowerCase()} course. Please archive it instead.`
      });
    }

    // Check if course has enrollments
    if (course.enrolledCount > 0) {
      return res.status(403).json({
        status: false,
        message: 'Cannot delete a course with enrolled students. Please archive it instead.'
      });
    }

    // Delete the course
    await Course.findByIdAndDelete(course._id);

    // Update teacher's course count
    await User.findByIdAndUpdate(teacherId, {
      $inc: { 'teacherProfile.totalCourses': -1 }
    });

    return res.status(200).json({
      status: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to delete course'
    });
  }
};

/**
 * Archive a course (soft delete)
 * POST /api/teacher/courses/:id/archive
 * Archived courses are hidden but not deleted
 */
const archiveCourse = async (req, res) => {
  try {
    const course = req.course;

    // Cannot archive draft courses - they should be deleted
    if (course.courseStatus === 'Draft') {
      return res.status(400).json({
        status: false,
        message: 'Draft courses should be deleted, not archived.'
      });
    }

    // Already archived
    if (course.courseStatus === 'Archived') {
      return res.status(400).json({
        status: false,
        message: 'Course is already archived.'
      });
    }

    await course.archive();

    return res.status(200).json({
      status: true,
      message: 'Course archived successfully',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        isActive: course.isActive
      }
    });

  } catch (error) {
    console.error('Archive Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to archive course'
    });
  }
};

/**
 * Restore an archived course
 * POST /api/teacher/courses/:id/restore
 */
const restoreCourse = async (req, res) => {
  try {
    const course = req.course;

    if (course.courseStatus !== 'Archived') {
      return res.status(400).json({
        status: false,
        message: 'Only archived courses can be restored.'
      });
    }

    // Restore to Draft status
    course.courseStatus = 'Draft';
    course.isActive = true;
    await course.save();

    return res.status(200).json({
      status: true,
      message: 'Course restored successfully. It is now in Draft status.',
      course: {
        _id: course._id,
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        isActive: course.isActive
      }
    });

  } catch (error) {
    console.error('Restore Course Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to restore course'
    });
  }
};

module.exports = {
  deleteCourse,
  archiveCourse,
  restoreCourse
};
