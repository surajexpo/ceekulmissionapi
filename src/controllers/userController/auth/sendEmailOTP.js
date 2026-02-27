const { EmailOTPModel } = require('../../../models/authModels');
const sendEmail = require('../../../utils/sendEmail');

/**
 * Send OTP to the authenticated user's registered email address.
 * Used to verify email ownership (and auto-verify teachers).
 *
 * POST /users/send-email-otp
 * @access Authenticated user
 */
const sendEmailOTP = async (req, res) => {
  try {
    const user = req.user;

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert OTP record
    await EmailOTPModel.findOneAndUpdate(
      { email: user.email },
      { otp, expiryTime, wrongAttempts: 0 },
      { upsert: true, new: true }
    );

    // Send email
    await sendEmail(
      user.email,
      'Verify your email address',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Email Verification</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0;color:#1a1a1a">
            ${otp}
          </div>
          <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    );

    return res.status(200).json({
      status: true,
      message: 'OTP sent to your registered email address',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('SendEmailOTP Error:', error.message);
    return res.status(500).json({
      status: false,
      message: 'Failed to send email OTP. Please try again.'
    });
  }
};

module.exports = sendEmailOTP;
