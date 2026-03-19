const mongoose = require('mongoose');

const availabilityScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Available', 'Booked', 'Maintenance', 'Closed'],
    default: 'Available'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { _id: false });

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  id: { type: String, required: true },
  capacity: { type: Number, required: true, min: [1, 'Capacity must be at least 1'] },
  length: { type: Number, min: 0 },
  width: { type: Number, min: 0 },
  area: { type: Number, min: 0 },
  type: { type: String },
  technology: [String],
  furniture: [String],
  lighting: [String],
  ventilation: [String],
  specializedEquipment: { type: String },
  accessibility: [String],
  primaryUsage: { type: String },
  availabilitySchedule: [availabilityScheduleSchema]
}, { _id: true });

const computerLabSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  id: { type: String, required: true },
  workstations: { type: Number, required: true, min: [0, 'Workstations cannot be negative'] },
  capacity: { type: Number, required: true, min: [1, 'Capacity must be at least 1'] },
  softwareAvailable: [String],
  internetSpeed: { type: String },
  availabilitySchedule: [availabilityScheduleSchema]
}, { _id: true });

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  id: { type: String, required: true },
  type: { type: String, required: true },
  capacity: { type: Number, min: 0 },
  dimensions: { type: String },
  soundSystem: { type: Boolean, default: false },
  lightingSystem: { type: Boolean, default: false },
  projectorScreen: { type: Boolean, default: false },
  availabilitySchedule: [availabilityScheduleSchema]
}, { _id: true });

const PartnerInfrastructureSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Infrastructure title is required'],
    trim: true
  },
  generalInfo: {
    schoolName: { type: String, required: true },
    address: { type: String, required: true },
    contactName: { type: String },
    contactEmail: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: '{VALUE} is not a valid email'
      }
    },
    contactPhone: { type: String, required: true },
    timeZone: { type: String, required: true }
  },
  classrooms: [classroomSchema],
  computerLabs: [computerLabSchema],
  otherFacilities: [facilitySchema]
}, {
  timestamps: true,
  collection: 'partner_infrastructures'
});

// Indexes
PartnerInfrastructureSchema.index({ partnerId: 1 });
PartnerInfrastructureSchema.index({ 'title': 1 }); // Helpful for searching by title
PartnerInfrastructureSchema.index({ 'classrooms.id': 1 });
PartnerInfrastructureSchema.index({ 'computerLabs.id': 1 });

const PartnerInfrastructure = mongoose.model('PartnerInfrastructure', PartnerInfrastructureSchema);

module.exports = PartnerInfrastructure;
