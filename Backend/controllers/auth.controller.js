const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../Models/user.model");
const sendMail = require("../utils/sendMail");
const generateOtp = require("../utils/generateOtp");


// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const otp = generateOtp();

        const user = new User({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpires: Date.now() + 10 * 60 * 1000,
            isVerified: false
        });

        await user.save();

        await sendMail(
            email,
            "Email Verification",
            `Hello ${name},

Your verification OTP is: ${otp}

This OTP will expire in 10 minutes.`
        );

        return res.status(201).json({
            success: true,
            message:
                "Registration successful. Please verify your email."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// VERIFY OTP
// ======================================================

const verifyOtp = async (req, res) => {

    try {

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "User already verified"
            });
        }

        if (
            !user.otpExpires ||
            user.otpExpires < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: "Please verify your email first"
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account is blocked. Please contact support."
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }


        // -------------------------------
        // ACCESS TOKEN
        // -------------------------------

        const accessToken = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        );


        // -------------------------------
        // REFRESH TOKEN
        // -------------------------------

        const refreshToken = jwt.sign(
            {
                id: user._id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "7d"
            }
        );
        user.refreshToken = refreshToken;
await user.save();

        return res.status(200).json({
            success: true,
            message: "Login Successful",

            accessToken,
            refreshToken,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }


    if (!user.refreshToken) {
    return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked"
    });
}

if (user.refreshToken !== refreshToken) {
    return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
    });
}
};


// ======================================================
// GET PROFILE
// ======================================================

const profile = async (req, res) => {

    try {

        const user = await User
            .findById(req.user.id)
            .select(
                "-password -otp -otpExpires -__v"
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// RESEND OTP
// ======================================================

const resendOtp = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "User already verified"
            });
        }

        const newOtp = generateOtp();

        user.otp = newOtp;

        user.otpExpires =
            Date.now() + 10 * 60 * 1000;

        await user.save();

        await sendMail(
            user.email,
            "Resend OTP",
            `Hello ${user.name},

Your new OTP is: ${newOtp}This OTP will expire in 10 minutes.DO not share this otp otherwise you will face serious heart failuer cause it will blast your device cause your device is faltu `
        );

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const newOtp = generateOtp();

        user.otp = newOtp;

        user.otpExpires =
            Date.now() + 10 * 60 * 1000;

        await user.save();

        await sendMail(
            user.email,
            "Forgot Password OTP",
            `Hello ${user.name},

Your OTP for password reset is: ${newOtp}

This OTP is valid for 10 minutes.`
        );

        return res.status(200).json({
            success: true,
            message:
                "Password reset OTP sent successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {

    try {

        const {
            email,
            otp,
            newPassword
        } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, OTP and new password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (
            !user.otpExpires ||
            user.otpExpires < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        user.password = hashedPassword;

        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// CHANGE PASSWORD
// ======================================================

const changePassword = async (req, res) => {

    try {

        const {
            oldPassword,
            newPassword
        } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Both passwords are required"
            });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different"
            });
        }

        const user =
            await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch =
            await bcrypt.compare(
                oldPassword,
                user.password
            );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message:
                    "Old password is incorrect"
            });
        }

        user.password =
            await bcrypt.hash(
                newPassword,
                10
            );

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// UPLOAD PROFILE PICTURE
// ======================================================

const uploadProfilePicture = async (req, res) => {

    try {

        const user =
            await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        user.profilePic = req.file.path;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Profile picture uploaded successfully",
            profilePic: user.profilePic
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// REFRESH ACCESS TOKEN
// ======================================================

const refreshAccessToken = async (req, res) => {

    try {

        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message:
                    "Refresh token is required"
            });
        }


        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );


        // Find user from refresh token
        const user =
            await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // Do not issue token to blocked user
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Account is blocked"
            });
        }


        // Generate a NEW access token
        const newAccessToken = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        );


        return res.status(200).json({
            success: true,
            message:
                "Access token refreshed successfully",

            accessToken: newAccessToken
        });

    } catch (error) {

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired refresh token"
        });
    }
};

const logoutUser=async(req,res,next)=>
{

    try{
        const user=  await User.findById(req.user.id);

        if(!user)
        {
            return res.status(404).json({
                success:false,
                message:"user not found"
            });
        }

        user.refreshToken=null;
        await user.save();
        return res.status(200).json({
            success:true,
            message:"Logout successful"
        })
    }
    catch(error){

        next(error);


    }

}


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
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
    logoutUser,
    
};