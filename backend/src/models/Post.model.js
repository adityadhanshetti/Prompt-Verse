import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        // Author
        createdByClerkId: {
            type: String,
            required: true,
        },
        createdByMongoDBObjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Content
        caption: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        // Image URL(s) — output examples like generated images
        images: {
            type: [String],
            default: [],
        },

        // Linked prompt — must exist and be created by the same user
        linkedPromptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prompt",
            default: null,
        },

        // Tags for discoverability
        tags: {
            type: [String],
            default: [],
        },

        // Engagement
        likedBy: {
            type: [String], // Clerk userIds
            default: [],
        },
        likesCount: {
            type: Number,
            default: 0,
        },

        commentsCount: {
            type: Number,
            default: 0,
        },

        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },
    },
    { timestamps: true },
);

const Post = mongoose.model("Post", postSchema);

export default Post;
