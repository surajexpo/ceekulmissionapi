const mongoose = require('mongoose');
const { User } = require('../../../models/authModels');

/**
 * Admin oversight controller for teacher accounts.
 * Teacher verification is now automatic (OTP-based), so this endpoint
 * handles post-verification administrative controls only.
 *
 * PUT /admin/users/:userId/manage
 *
 * Actions:
 *  - suspend       → Set status to 'Suspended'. Blocks all access.
 *  - activate      → Restore status to 'Active' after suspension.
 *  - revoke        → Revoke teacher verification (back to 'Pending').
 *                    Use when a teacher violates policy.
 *  - force_verify  → Admin manually grants verification override.
 *                    Use for edge cases (e.g. email-password teacher who
 *                    cannot complete OTP flow).
 *
 * @access Admin
 */
const manageTeacher = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: false, message: 'Invalid user ID' });
    }

    const ALLOWED_ACTIONS = ['suspend', 'activate', 'revoke', 'force_verify'];
    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return res.status(400).json({
        status: false,
        message: `action must be one of: ${ALLOWED_ACTIONS.join(', ')}`
      });
    }

    // reason is mandatory for destructive actions
    if (['suspend', 'revoke'].includes(action) && !reason) {
      return res.status(400).json({
        status: false,
        message: `reason is required for action '${action}'`
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    // Role check removed as per SELECTED_ROLES removal

    const now = new Date();
    let updateFields = {};
    let responseMessage = '';

    switch (action) {
      case 'suspend':
        if (user.status === 'Suspended') {
          return res.status(400).json({ status: false, message: 'Teacher is already suspended' });
        }
        updateFields = { status: 'Suspended' };
        responseMessage = 'Teacher account suspended';
        break;

      case 'activate':
        if (user.status === 'Active') {
          return res.status(400).json({ status: false, message: 'Teacher is already active' });
        }
        updateFields = { status: 'Active' };
        responseMessage = 'Teacher account reactivated';
        break;

      case 'revoke':
        if (user.verificationStatus === 'Pending') {
          return res.status(400).json({ status: false, message: 'Teacher verification is already pending' });
        }
        updateFields = {
          verificationStatus: 'Pending',
          verifiedBy: null
        };
        responseMessage = 'Teacher verification revoked';
        break;

      case 'force_verify':
        if (user.verificationStatus === 'Verified') {
          return res.status(400).json({ status: false, message: 'Teacher is already verified' });
        }
        updateFields = {
          verificationStatus: 'Verified',
          verifiedBy: {
            verifierId: req.admin._id,
            verifierRole: 'Admin',
            verifiedAt: now
          },
          'teacherProfile.teacherVerifiedAt': now
        };
        responseMessage = 'Teacher verified by admin override';
        break;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -__v');

    return res.status(200).json({
      status: true,
      message: responseMessage,
      ...(reason && { reason }),
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        verificationStatus: updated.verificationStatus,
        status: updated.status,
        phoneVerified: updated.phoneVerified,
        emailVerified: updated.emailVerified
      }
    });

  } catch (err) {
    console.error('ManageTeacher Error:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: messages.join(', ') });
    }

    return res.status(500).json({
      status: false,
      message: 'An error occurred while managing teacher account'
    });
  }
};

module.exports = manageTeacher;
