const mongoose = require('mongoose');

// Session sub-schema
const sessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Session date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format']
  },
  activity: {
    type: String,
    required: [true, 'Session activity is required'],
    trim: true,
    maxlength: [200, 'Activity cannot exceed 200 characters']
  },
  fee: {
    type: Number,
    required: [true, 'Session fee is required'],
    min: [0, 'Fee cannot be negative']
  },
  mode: {
    type: String,
    enum: ['online', 'hybrid'],
    required: [true, 'Session mode is required']
  },
  location: {
    type: String,
    trim: true,
    default: null
  }
}, { _id: true });

// Main Workshop Schema
const workshopSchema = new mongoose.Schema({
  workshopTitle: {
    type: String,
    required: [true, 'Workshop title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  workshopDescription: {
    type: String,
    required: [true, 'Workshop description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  expertDescription: {
    type: String,
    trim: true,
    maxlength: [2000, 'Expert description cannot exceed 2000 characters']
  },
  workshopMode: {
    type: String,
    enum: ['online', 'hybrid'],
    required: [true, 'Workshop mode is required']
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required']
  },
  instructorType: {
    type: String,
    enum: ['myself', 'open'],
    required: [true, 'Instructor type is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled'],
    default: 'draft'
  },
  sessions: [sessionSchema],
  totalRevenuePotential: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'workshops'
});

// ==================== INDEXES ====================
workshopSchema.index({ createdBy: 1 });
workshopSchema.index({ status: 1 });
workshopSchema.index({ 'sessions.date': 1 });
workshopSchema.index({ createdBy: 1, status: 1 });

// ==================== PRE-SAVE ====================
workshopSchema.pre('save', function () {
  if (this.sessions && this.sessions.length > 0) {
    this.totalRevenuePotential = this.sessions.reduce((sum, s) => sum + (s.fee || 0), 0);
  }
});

const Workshop = mongoose.model('Workshop', workshopSchema);
module.exports = Workshop;
