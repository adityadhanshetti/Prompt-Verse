import Follow from "../models/Follow.model.js";
import User from "../models/User.model.js";
import { createNotification } from "../utils/createNotification.js";

// POST /api/follow/:userId (protected)
export const followUser = async (req, res) => {
    try {
        const followerClerkId = req.auth?.userId;
        const followingClerkId = req.params.userId;

        if (!followerClerkId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (followerClerkId === followingClerkId) {
            return res
                .status(400)
                .json({ message: "You cannot follow yourself" });
        }

        // Convert Clerk IDs to MongoDB IDs
        const [follower, following] = await Promise.all([
            User.findOne({ clerkId: followerClerkId }),
            User.findOne({ clerkId: followingClerkId }),
        ]);

        if (!follower || !following) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingFollow = await Follow.findOne({
            followerId: follower._id,
            followingId: following._id,
        });

        if (existingFollow) {
            return res.status(200).json({
                message: "Already following",
                isFollowing: true,
            });
        }

        const follow = await Follow.create({
            followerId: follower._id,
            followingId: following._id,
        });

        await createNotification({
            recipientId: following._id,
            senderId: follower._id,
            type: "follow",
            message: "started following you",
        });

        res.status(201).json({
            follow,
            isFollowing: true,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/follow/:userId (protected)
export const unfollowUser = async (req, res) => {
    try {
        const followerClerkId = req.auth?.userId;
        const followingClerkId = req.params.userId;

        if (!followerClerkId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Convert Clerk IDs to MongoDB IDs
        const [follower, following] = await Promise.all([
            User.findOne({ clerkId: followerClerkId }),
            User.findOne({ clerkId: followingClerkId }),
        ]);

        if (!follower || !following) {
            return res.status(404).json({ message: "User not found" });
        }

        await Follow.deleteOne({
            followerId: follower._id,
            followingId: following._id,
        });

        res.json({ message: "Unfollowed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/follow/stats/:userId
export const getFollowStats = async (req, res) => {
    try {
        const clerkUserId = req.params.userId;

        const user = await User.findOne({ clerkId: clerkUserId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const followers = await Follow.countDocuments({
            followingId: user._id,
        });
        const following = await Follow.countDocuments({ followerId: user._id });

        res.json({ followers, following });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/follow/check/:userId (protected)
export const checkFollowing = async (req, res) => {
    try {
        const followerClerkId = req.auth?.userId;
        const followingClerkId = req.params.userId;

        if (!followerClerkId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Convert Clerk IDs to MongoDB IDs
        const [follower, following] = await Promise.all([
            User.findOne({ clerkId: followerClerkId }),
            User.findOne({ clerkId: followingClerkId }),
        ]);

        if (!follower || !following) {
            return res.json({ isFollowing: false });
        }

        const exists = await Follow.findOne({
            followerId: follower._id,
            followingId: following._id,
        });

        res.json({ isFollowing: !!exists });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/follow/feed (protected)
export const getFollowingFeed = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;

        if (!clerkUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Get MongoDB user ID
        const me = await User.findOne({ clerkId: clerkUserId });
        if (!me) {
            return res.status(404).json({ message: "User not found" });
        }

        const followingList = await Follow.find({ followerId: me._id }).select(
            "followingId",
        );

        const followingMongoIds = followingList.map((f) => f.followingId);

        const prompts = await Prompt.find({
            authorId: { $in: followingMongoIds },
            visibility: "public",
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(prompts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
