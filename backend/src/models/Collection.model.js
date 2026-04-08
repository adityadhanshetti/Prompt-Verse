import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },

        description: {
            type: String,
            default: "",
            maxlength: 500,
        },

        coverImage: {
            type: String,
            default: "",
        },

        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },

        prompts: [
            {
                promptId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Prompt",
                    required: true,
                },
                order: {
                    type: Number,
                    default: 0,
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        savesCount: {
            type: Number,
            default: 0,
        },

// Removed savedBy array; now managed by the Interaction model.
    },
    { timestamps: true },
);

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
