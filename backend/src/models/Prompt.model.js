import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150,
        },

        promptText: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
        },

        tags: {
            type: [String],
            default: [],
        },

        category: {
            type: String,
            default: "general",
        },

        modelSupport: {
            type: [String],
            default: [],
        },

        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        isTemplate: {
            type: Boolean,
            default: false,
        },

        variables: [
            {
                key: String,
                description: String,
                defaultValue: String,
                required: { type: Boolean, default: false },
            },
        ],

        forkedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prompt",
            default: null,
        },

        forkedFromUser: {
            type: mongoose.Schema.Types.ObjectId, // User ObjectId of original owner
            ref: "User",
            default: null,
        },

// Removed likedBy and savedBy arrays; these are now managed by the Interaction model.

        copiesCount: {
            type: Number,
            default: 0,
        },

        likesCount: {
            type: Number,
            default: 0,
        },

        savesCount: {
            type: Number,
            default: 0,
        },

        forksCount: {
            type: Number,
            default: 0,
        },

        visibility: {
            type: String,
            enum: ["public", "private", "unlisted"],
            default: "public",
        },
    },
    { timestamps: true },
);

const Prompt = mongoose.model("Prompt", promptSchema);

export default Prompt;
