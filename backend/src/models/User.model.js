import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },

        username: {
            type: String,
            default: null,
        },

        email: {
            type: String,
            default: null,
        },

        fullName: {
            type: String,
            default: null,
        },

        avatar: {
            type: String,
            default: null,
        },

        bio: {
            type: String,
            default: "",
            maxlength: 300,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isPremium: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
