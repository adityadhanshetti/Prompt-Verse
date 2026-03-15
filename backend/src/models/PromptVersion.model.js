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

        editedBy: {
            type: String, // Clerk userId
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
