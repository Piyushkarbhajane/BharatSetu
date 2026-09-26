const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            default: ""
        },

        bio: {
            type: String,
            default: ""
        },

        profilePic: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        isBlocked: {
            type: Boolean,
            default: false
        },

        otp: {
            type: String
        },

        otpExpires: {
            type: Date
        },

        refreshToken:{

            type:String,default:null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);