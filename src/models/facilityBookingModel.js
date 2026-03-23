const mongoose = require('mongoose');

const facilityBookingSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    index: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PartnerInfrastructure',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
    index: true
  },
  startTime: {
    type: String, // HH:mm format
    required: true
  },
  endTime: {
    type: String, // HH:mm format
    required: true
  },
  sessionId: {
    type: String, // Reference back to the workshop/session if needed
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'Pending'],
    default: 'Confirmed'
  }
}, {
  timestamps: true,
  collection: 'facility_bookings'
});

// Composite index to easily find overlapping bookings for a given facility on a date
facilityBookingSchema.index({ facilityId: 1, date: 1 });

const FacilityBooking = mongoose.model('FacilityBooking', facilityBookingSchema);

module.exports = FacilityBooking;
