const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: [true, 'Workshop ID is required'],
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

// Ensure a user is only enrolled in a workshop once with a specific role (or at all)
enrollmentSchema.index({ workshopId: 1, userId: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
