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

        createdByClerkId: {
            type: String, // Clerk userId
            required: true,
        },

        createdByMongoDBObjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
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
            type: String, // Clerk userId of original owner
            default: null,
        },

        likedBy: {
            type: [String], // Clerk userIds
            default: [],
        },

        savedBy: {
            type: [String], // Clerk userIds
            default: [],
        },

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
