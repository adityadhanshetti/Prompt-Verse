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

        createdByClerkId: {
            type: String, // Clerk userId
            required: true,
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

        savedBy: {
            type: [String], // array of Clerk user IDs
            default: [],
        },
    },
    { timestamps: true },
);

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
