import mongoose from "mongoose";

const promptVersionSchema = new mongoose.Schema(
    {
        promptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prompt",
            required: true,
        },

        versionNumber: {
            type: Number,
            required: true,
        },

        title: {
            type: String,
            required: true,
        },

        promptText: {
            type: String,
            required: true,
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

        visibility: {
            type: String,
            enum: ["public", "private", "unlisted"],
            default: "public",
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

        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        changeNote: {
            type: String,
            default: "",
        },
    },
    { timestamps: true },
);

const PromptVersion = mongoose.model("PromptVersion", promptVersionSchema);

export default PromptVersion;
