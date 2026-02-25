const { User } = require("../../../models/authModels");

const applyTeacher = async (req, res) => {
  try {
    const { bio, qualification, expertise, experience } = req.body;

    // Validate required fields
    if (!bio) {
      return res.status(400).json({ status: false, message: "bio is required" });
    }
    if (!qualification) {
      return res.status(400).json({ status: false, message: "qualification is required" });
    }
    if (!expertise || !Array.isArray(expertise) || expertise.length === 0) {
      return res.status(400).json({ status: false, message: "expertise is required and must be a non-empty array" });
    }
    if (experience === undefined || experience === null || experience < 0) {
      return res.status(400).json({ status: false, message: "experience is required and must be a non-negative number" });
    }

    // Check if user already has Teacher role
    if (req.user.selectedRole === "Teacher") {
      return res.status(400).json({
        status: false,
        message: "You have already applied as a teacher",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          selectedRole: "Teacher",
          verificationStatus: "Verified",
          "teacherProfile.bio": bio,
          "teacherProfile.qualification": qualification,
          "teacherProfile.expertise": expertise,
          "teacherProfile.experience": experience,
          "teacherProfile.teacherVerifiedAt": new Date(),
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    res.status(200).json({
      status: true,
      message: "Teacher application submitted successfully. Your account is now verified.",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        selectedRole: updatedUser.selectedRole,
        verificationStatus: updatedUser.verificationStatus,
        teacherProfile: {
          bio: updatedUser.teacherProfile.bio,
          qualification: updatedUser.teacherProfile.qualification,
          expertise: updatedUser.teacherProfile.expertise,
          experience: updatedUser.teacherProfile.experience,
        },
      },
    });
  } catch (err) {
    console.error("Apply Teacher Error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: messages.join(", ") });
    }

    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

module.exports = applyTeacher;
