import Follow from "../models/Follow.model.js";
import Prompt from "../models/Prompt.model.js";
import Notification from "../models/Notification.model.js";


// POST /api/follow/:userId (protected)
export const followUser = async (req, res) => {
    try {
        const followerId = req.auth?.userId;
        const followingId = req.params.userId;

        if (!followerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (followerId === followingId) {
            return res
                .status(400)
                .json({ message: "You cannot follow yourself" });
        }

        const follow = await Follow.create({
            followerId,
            followingId,
        });

        await Notification.create({
            userId: followingId,
            type: "follow",
            fromUserId: followerId,
            message: "Started following you",
        });

        res.status(201).json(follow);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/follow/:userId (protected)
export const unfollowUser = async (req, res) => {
    try {
        const followerId = req.auth?.userId;
        const followingId = req.params.userId;

        if (!followerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await Follow.deleteOne({ followerId, followingId });

        res.json({ message: "Unfollowed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/follow/stats/:userId
export const getFollowStats = async (req, res) => {
    try {
        const userId = req.params.userId;

        const followers = await Follow.countDocuments({ followingId: userId });
        const following = await Follow.countDocuments({ followerId: userId });

        res.json({ followers, following });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/follow/check/:userId (protected)
export const checkFollowing = async (req, res) => {
    try {
        const followerId = req.auth?.userId;
        const followingId = req.params.userId;

        if (!followerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const exists = await Follow.findOne({ followerId, followingId });

        res.json({ isFollowing: !!exists });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/follow/feed (protected)
export const getFollowingFeed = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const followingList = await Follow.find({ followerId: userId }).select(
            "followingId",
        );

        const followingIds = followingList.map((f) => f.followingId);

        const prompts = await Prompt.find({
            createdByClerkId: { $in: followingIds },
            visibility: "public",
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(prompts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
