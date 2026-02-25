const mongoose = require("mongoose");
const { User } = require("../../../models/authModels");

const verifyTeacher = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: false, message: "Invalid user ID" });
    }

    if (!action || !["verify", "reject"].includes(action)) {
      return res.status(400).json({
        status: false,
        message: "Action must be 'verify' or 'reject'",
      });
    }

    if (action === "reject" && !reason) {
      return res.status(400).json({
        status: false,
        message: "Rejection reason is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (user.selectedRole !== "Teacher") {
      return res.status(400).json({
        status: false,
        message: "User is not a teacher",
      });
    }

    if (user.verificationStatus !== "Pending") {
      return res.status(400).json({
        status: false,
        message: `User verification status is already ${user.verificationStatus}`,
      });
    }

    const now = new Date();
    const updateData = {
      verificationStatus: action === "verify" ? "Verified" : "Rejected",
      verifiedBy: {
        verifierId: req.admin._id,
        verifierRole: "Admin",
        verifiedAt: now,
      },
    };

    if (action === "verify") {
      updateData["teacherProfile.teacherVerifiedAt"] = now;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      status: true,
      message:
        action === "verify"
          ? "Teacher verified successfully"
          : "Teacher application rejected",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        selectedRole: updatedUser.selectedRole,
        verificationStatus: updatedUser.verificationStatus,
        verifiedBy: updatedUser.verifiedBy,
        teacherVerifiedAt: updatedUser.teacherProfile?.teacherVerifiedAt,
      },
    });
  } catch (err) {
    console.error("Verify Teacher Error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: messages.join(", ") });
    }

    res.status(500).json({
      status: false,
      message: "An error occurred while verifying teacher",
    });
  }
};

module.exports = verifyTeacher;
