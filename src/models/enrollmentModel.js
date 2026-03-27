const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: [true, 'Workshop ID is required'],
    index: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  role: {
    type: String,
    enum: ['Expert', 'Instructor', 'Student'],
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'withdrawn', 'cancelled'],
    default: 'active',
    index: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'enrollments'
});

// Ensure a user is only enrolled in a workshop once with a specific role
// Wait, if a student enrolls in multiple schedules in the SAME workshop, they might fail this unique check!
// Let's modify the index to include scheduleId if the role is student and scheduleId is present
// Note: For now, keeping the unique index simple, but we should drop the unique index if students can re-enroll multiple schedules
// Actually, since students only enroll in one schedule per session, maybe unique across (workshopId, userId, scheduleId)?
enrollmentSchema.index({ workshopId: 1, userId: 1, scheduleId: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
