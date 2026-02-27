const { User, EmailOTPModel } = require('../../../models/authModels');

/**
 * Verify the email OTP for the authenticated user.
 * If the user is a Teacher with Pending status, they are automatically
 * promoted to Verified — no admin approval required.
 *
 * POST /users/verify-email-otp
 * @access Authenticated user
 */
const verifyEmailOTP = async (req, res) => {
  try {
    const user = req.user;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ status: false, message: 'OTP is required' });
    }

    if (!user.email) {
      return res.status(400).json({
        status: false,
        message: 'No email address is associated with your account'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        status: false,
        message: 'Your email address is already verified'
      });
    }

    const otpRecord = await EmailOTPModel.findOne({ email: user.email });

    if (!otpRecord) {
      return res.status(404).json({
        status: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    if (otpRecord.wrongAttempts >= 3) {
      await EmailOTPModel.deleteOne({ email: user.email });
      return res.status(429).json({
        status: false,
        message: 'Too many wrong attempts. Please request a new OTP.'
      });
    }

    if (Date.now() > otpRecord.expiryTime) {
      await EmailOTPModel.deleteOne({ email: user.email });
      return res.status(400).json({
        status: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (otpRecord.otp !== Number(otp)) {
      otpRecord.wrongAttempts += 1;
      await otpRecord.save();
      const remaining = 3 - otpRecord.wrongAttempts;
      return res.status(400).json({
        status: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`
      });
    }

    // OTP valid — delete record
    await EmailOTPModel.deleteOne({ email: user.email });

    // Build the update payload
    const now = new Date();
    const updateFields = { emailVerified: true };
    let autoVerified = false;

    // Auto-verify teacher: email OTP is sufficient proof — no admin gate.
    if (user.selectedRole === 'Teacher' && user.verificationStatus === 'Pending') {
      updateFields.verificationStatus = 'Verified';
      updateFields.verifiedBy = { verifierRole: 'System', verifiedAt: now };
      updateFields['teacherProfile.teacherVerifiedAt'] = now;
      autoVerified = true;
    }

    await User.findByIdAndUpdate(user._id, { $set: updateFields });

    return res.status(200).json({
      status: true,
      message: autoVerified
        ? 'Email verified. Your teacher account is now active.'
        : 'Email verified successfully.',
      emailVerified: true,
      ...(autoVerified && { verificationStatus: 'Verified' })
    });

  } catch (error) {
    console.error('VerifyEmailOTP Error:', error.message);
    return res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = verifyEmailOTP;
