const mongoose = require("mongoose");
const { User } = require("../../../models/authModels");

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid userId."
      });
    }

    // Find user and exclude password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found."
      });
    }

    // Check if user is suspended
    if (user.status === 'Suspended') {
      return res.status(403).json({
        status: false,
        message: "This account has been suspended."
      });
    }

    // Prepare response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      profileImage: user.profileImage,
      address: user.address,
      selectedRole: user.selectedRole,
      partnerType: user.partnerType,
      activityType: user.activityType,
      modeOptions: user.modeOptions,
      expertTypes: user.expertTypes,
      verificationStatus: user.verificationStatus,
      authProvider: user.authProvider,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(200).json({
      status: true,
      message: "User fetched successfully.",
      user: userResponse
    });

  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      status: false,
      message: "Server error while fetching user."
    });
  }
};

module.exports = getUserById;
