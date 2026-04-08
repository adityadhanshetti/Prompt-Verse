import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        // Author
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
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
// Removed likedBy array; now managed by the Interaction model.
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
