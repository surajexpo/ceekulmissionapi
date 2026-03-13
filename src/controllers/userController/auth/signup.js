const UserService = require("../../../services/userService");
const { generateToken } = require("../../../utils/generateToken");
const signup = async (req, res) => {
  try {
    const data = req.validatedBody ?? req.body;
    const user = await UserService.createUser(data);

    const token = generateToken({
      id: user._id,
      authProvider: user.authProvider,
    });

    return res.status(201).json({
      status: true,
      message: "Successfully registered",
      result: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          authProvider: user.authProvider,
          verificationStatus: user.verificationStatus,
          status: user.status,
        },
        token,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);

    if (err.status === 409) {
      return res.status(409).json({
        status: false,
        message: err.message,
      });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        status: false,
        message: messages.join(", "),
      });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        status: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      status: false,
      message: "An error occurred during registration",
      debug: err.message,
    });
  }
};

module.exports = signup;
