const mongoose = require("mongoose");
const { User } = require("../../../models/authModels");
const { SELECTED_ROLES } = require("../../../constants/userConstants");

const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { selectedRole } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: false, message: "Invalid user ID" });
    }

    if (!selectedRole || !SELECTED_ROLES.includes(selectedRole)) {
      return res.status(400).json({
        status: false,
        message: `Invalid role. Must be one of: ${SELECTED_ROLES.join(", ")}`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (user.selectedRole === selectedRole) {
      return res.status(400).json({
        status: false,
        message: "User already has this role",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { selectedRole } },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      status: true,
      message: `User role updated to ${selectedRole} successfully`,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        selectedRole: updatedUser.selectedRole,
        verificationStatus: updatedUser.verificationStatus,
      },
    });
  } catch (err) {
    console.error("Change User Role Error:", err);
    res.status(500).json({
      status: false,
      message: "An error occurred while updating user role",
    });
  }
};

module.exports = changeUserRole;
