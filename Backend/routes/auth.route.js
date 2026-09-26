const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const upload =
    require("../middleware/upload.middleware");

const {
    updateProfile
} = require("../controllers/profile.controller");
const {
    loginLimiter
} = require("../middleware/rateLimit.middleware");
const {validateRegister,validateLogin} =require("../middleware/validation.middleware");
const {
    registerUser,
    verifyOtp,
    loginUser,
    profile,
    resendOtp,
    forgotPassword,
    resetPassword,
    changePassword,
    uploadProfilePicture,
    refreshAccessToken,
    logoutUser
} = require("../controllers/auth.controller");


router.post(
    "/register",
    validateRegister,
    registerUser
);

router.post(
    "/verify-otp",
    verifyOtp
);

router.post(
    "/login",
    loginLimiter,
    validateLogin,
    loginUser
);

router.get(
    "/profile",
    authMiddleware,
    profile
);

router.post(
    "/resend-otp",
    resendOtp
);

router.post(
    "/forgot-password",
    forgotPassword
);

router.post(
    "/reset-password",
    resetPassword
);

router.post(
    "/change-password",
    authMiddleware,
    changePassword
);

router.put(
    "/update-profile",
    authMiddleware,
    updateProfile
);

router.put(
    "/upload-profile-picture",
    authMiddleware,
    upload.single("profilePic"),
    uploadProfilePicture
);

router.post(
    "/refresh-token",
    refreshAccessToken
    
);

router.post(
    "/logout",authMiddleware,logoutUser
)


module.exports = router;