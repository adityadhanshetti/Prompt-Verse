import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            enum: ["Prompt", "Post", "Collection"],
            required: true,
        },
        interactionType: {
            type: String,
            enum: ["LIKE", "SAVE"],
            required: true,
        },
    },
    { timestamps: true },
);

// Prevent duplicate likes/saves from the same user on the same object
interactionSchema.index(
    { userId: 1, targetId: 1, interactionType: 1 },
    { unique: true }
);

const Interaction = mongoose.model("Interaction", interactionSchema);

export default Interaction;
