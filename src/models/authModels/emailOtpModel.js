const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: Number,
    required: true
  },
  expiryTime: {
    type: Date,
    required: true
  },
  wrongAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'EmailOTPModel'
});

// Auto-delete expired OTP documents
emailOtpSchema.index({ expiryTime: 1 }, { expireAfterSeconds: 0 });

const EmailOTPModel = mongoose.model('EmailOTPModel', emailOtpSchema);
module.exports = EmailOTPModel;
