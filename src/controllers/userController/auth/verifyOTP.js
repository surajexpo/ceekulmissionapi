const { User, OTPModel } = require("../../../models/authModels");
const { generateToken } = require("../../../utils/generateToken");

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Support 'phone', 'mobileNumber', and 'number' for backward compatibility
    const number = phone || req.body.mobileNumber || req.body.number;

    if (!number || !otp) {
      return res.status(400).json({
        status: false,
        message: "Phone number and OTP are required"
      });
    }

    // Validate phone format
    if (!/^\+?[1-9]\d{6,14}$/.test(number)) {
      return res.status(400).json({
        status: false,
        message: "Invalid phone number format"
      });
    }

    // Find the OTP record
    const otpRecord = await OTPModel.findOne({ number });

    if (!otpRecord) {
      return res.status(404).json({
        status: false,
        message: "OTP not found. Please request a new OTP."
      });
    }

    // Check for too many wrong attempts
    if (otpRecord.wrongAttampts >= 3) {
      // Delete the OTP record
      await OTPModel.deleteOne({ number });
      return res.status(429).json({
        status: false,
        message: "Too many wrong attempts. Please request a new OTP."
      });
    }

    // Check if the OTP has expired
    if (Date.now() > otpRecord.expiryTime) {
      await OTPModel.deleteOne({ number });
      return res.status(400).json({
        status: false,
        message: "OTP has expired. Please request a new OTP."
      });
    }

    // Check if the OTP is correct
    if (otpRecord.otp !== Number(otp)) {
      otpRecord.wrongAttampts += 1;
      await otpRecord.save();

      const remainingAttempts = 3 - otpRecord.wrongAttampts;
      return res.status(400).json({
        status: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // OTP is valid - delete the record
    await OTPModel.deleteOne({ number });

    // Find existing user by mobile number
    const existingUser = await User.findByMobile(number);

    if (!existingUser) {
      // User doesn't exist - they need to complete registration
      return res.status(200).json({
        status: true,
        message: "OTP verified successfully. Please complete registration.",
        isNewUser: true,
        phone: number
      });
    }

    // Check if account is suspended
    if (existingUser.status === 'Suspended') {
      return res.status(403).json({
        status: false,
        message: "Your account has been suspended. Please contact support."
      });
    }

    // Auto-verify teacher: successful phone OTP is sufficient proof of identity.
    // No admin approval required.
    if (
      existingUser.selectedRole === 'Teacher' &&
      existingUser.verificationStatus === 'Pending'
    ) {
      const now = new Date();
      await existingUser.updateOne({
        $set: {
          phoneVerified: true,
          verificationStatus: 'Verified',
          verifiedBy: { verifierRole: 'System', verifiedAt: now },
          'teacherProfile.teacherVerifiedAt': now
        }
      });
      existingUser.verificationStatus = 'Verified';
      existingUser.phoneVerified = true;
    } else if (!existingUser.phoneVerified) {
      await existingUser.updateOne({ $set: { phoneVerified: true } });
      existingUser.phoneVerified = true;
    }

    // Reset login attempts on successful OTP verification
    await existingUser.resetLoginAttempts();

    // Generate token for existing user
    const token = generateToken({
      id: existingUser._id,
      authProvider: existingUser.authProvider
    });

    // Prepare user response
    const userResponse = {
      _id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      phone: existingUser.phone,
      authProvider: existingUser.authProvider,
      verificationStatus: existingUser.verificationStatus,
      status: existingUser.status,
      profileImage: existingUser.profileImage,
      lastLoginAt: existingUser.lastLoginAt
    };

    return res.status(200).json({
      status: true,
      message: "OTP verified successfully. Login successful.",
      isNewUser: false,
      token,
      user: userResponse
    });

  } catch (error) {
    console.error("VerifyOTP Error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

module.exports = verifyOTP;
