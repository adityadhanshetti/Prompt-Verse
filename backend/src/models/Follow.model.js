import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
    {
        followerId: {
            type: String, // Clerk userId
            required: true,
        },
        followingId: {
            type: String, // Clerk userId
            required: true,
        },
    },
    { timestamps: true },
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = mongoose.model("Follow", followSchema);

export default Follow;
