import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // who receives notification
            required: true,
        },

        type: {
            type: String,
            enum: ["follow", "like", "fork", "save", "collection_add"],
            required: true,
        },

        fromUserId: {
            type: String, // who triggered notification
            required: true,
        },

        promptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prompt",
            default: null,
        },

        collectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Collection",
            default: null,
        },

        message: {
            type: String,
            default: "",
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
