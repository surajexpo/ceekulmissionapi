const createCourse = require('./createCourse');
const { updateCourse, updateSyllabus } = require('./updateCourse');
const {
  getCoursePublic,
  getCourseForTeacher,
  getTeacherCourses,
  getPublishedCourses,
  getFeaturedCourses,
  getCoursesByCategory
} = require('./getCourse');
const { deleteCourse, archiveCourse, restoreCourse } = require('./deleteCourse');
const {
  submitForReview,
  publishCourse,
  unpublishCourse,
  withdrawFromReview,
  cloneCourse
} = require('./courseActions');
const {
  getPendingCourses,
  getCourseForReview,
  startReview,
  approveCourse,
  rejectCourse,
  requestChanges,
  toggleFeature,
  getAllCoursesAdmin
} = require('./reviewCourse');

module.exports = {
  // Teacher Course CRUD
  createCourse,
  updateCourse,
  updateSyllabus,
  getCourseForTeacher,
  getTeacherCourses,
  deleteCourse,
  archiveCourse,
  restoreCourse,

  // Teacher Course Actions
  submitForReview,
  publishCourse,
  unpublishCourse,
  withdrawFromReview,
  cloneCourse,

  // Public Course Access
  getCoursePublic,
  getPublishedCourses,
  getFeaturedCourses,
  getCoursesByCategory,

  // Admin Course Review
  getPendingCourses,
  getCourseForReview,
  startReview,
  approveCourse,
  rejectCourse,
  requestChanges,
  toggleFeature,
  getAllCoursesAdmin
};
