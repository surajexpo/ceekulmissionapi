const { User } = require('../../../models/authModels');

const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      dateOfBirth,
      gender,
      address,
      activityType,
      modeOptions,
      expertTypes,
      selectedRole
    } = req.body;

    const updates = {};

    // Update allowed fields
    if (name) {
      updates.name = name.trim();
    }

    if (dateOfBirth) {
      updates.dateOfBirth = new Date(dateOfBirth);
    }

    if (gender) {
      updates.gender = gender;
    }

    if (Array.isArray(activityType)) {
      updates.activityType = activityType;
    }

    if (Array.isArray(modeOptions)) {
      updates.modeOptions = modeOptions;
    }

    if (Array.isArray(expertTypes)) {
      updates.expertTypes = expertTypes;
    }

    if (selectedRole) {
      updates.selectedRole = selectedRole;
      // Sync system role field
      if (selectedRole === 'Partner') updates.role = 'Partner';
      else if (selectedRole === 'Teacher') updates.role = 'Teacher';
      else updates.role = 'Student';
    }

    // Handle address updates
    if (address && typeof address === 'object') {
      const existingUser = await User.findById(user._id);
      const existingAddress = existingUser.address?.toObject?.() || {};

      updates.address = {
        ...existingAddress,
        ...(address.village && { village: address.village }),
        ...(address.pincode && { pincode: address.pincode }),
        ...(address.district && { district: address.district }),
      };
    }

    // Handle avatar/profile image upload
    if (req?.files?.avtar && req.files.avtar.length > 0) {
      updates.profileImage = `/public/User/${req.files.avtar[0].filename}`;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: false,
        message: "No valid fields to update"
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    // Prepare response
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      profileImage: updatedUser.profileImage,
      address: updatedUser.address,
      activityType: updatedUser.activityType,
      modeOptions: updatedUser.modeOptions,
      expertTypes: updatedUser.expertTypes,
      selectedRole: updatedUser.selectedRole,
      verificationStatus: updatedUser.verificationStatus,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt
    };

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      user: userResponse
    });

  } catch (error) {
    console.error("UpdateProfile Error:", error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        status: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

module.exports = updateProfile;
