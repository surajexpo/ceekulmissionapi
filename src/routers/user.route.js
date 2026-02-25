const userRoute = require("express").Router();
const { updateUserProfile, updateProfile, sendOTP, verifyOTP, signup, login, getUserById, getAllUsers, changePassword, applyTeacher } = require("../controllers/userController");
const { authenticateUser, fileUploader } = require("../middlewares");
const validateRequest = require("../middlewares/validateRequest");
const { signupSchema } = require("../validators");

//---------- Public routes (no auth required) ----------
userRoute.post("/signup", signup);
userRoute.post("/login", login);
userRoute.post("/sendOTP", sendOTP);
userRoute.post("/verifyOTP", verifyOTP);

//---------- Protected routes (auth required) ----------
// Static routes must come before dynamic :userId routes
// userRoute.get("/", authenticateUser, getAllUsers);

userRoute.get("/",  getAllUsers);
userRoute.post("/update-profile-image", authenticateUser, fileUploader);
userRoute.post("/updateprofile", authenticateUser, fileUploader(
    [
        { name: "avtar", maxCount: 1 },
    ],
    "User"
), updateProfile);

// Teacher application
userRoute.post("/apply-teacher", authenticateUser, applyTeacher);

// Dynamic routes with :userId parameter
userRoute.get("/:userId", authenticateUser, getUserById);
userRoute.put("/:userId/profile", authenticateUser, fileUploader([{ name: "profileImage", maxCount: 1 }], "User"), updateUserProfile);
userRoute.put("/:userId/change-password", authenticateUser, changePassword);

module.exports = userRoute;