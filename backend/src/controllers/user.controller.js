import Prompt from "../models/Prompt.model.js";
import Post from "../models/Post.model.js";
import Collection from "../models/Collection.model.js";
import Follow from "../models/Follow.model.js";
import Interaction from "../models/Interaction.model.js";
import User from "../models/User.model.js";
import clerkClient from "../configs/clerkClient.js";

/**
 * GET /api/users/:userId/profile
 * Public stats for a user (now includes postsCount)
 */
export const getUserProfileStats = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        const targetUser = await User.findOne({ clerkId: userId });
        const targetMongoId = targetUser?._id;

        const [
            followersCount,
            followingCount,
            promptsCount,
            collectionsCount,
            postsCount,
        ] = await Promise.all([
            Follow.countDocuments({ followingId: targetMongoId }),
            Follow.countDocuments({ followerId: targetMongoId }),
            Prompt.countDocuments({
                authorId: targetMongoId,
                visibility: "public",
            }),
            Collection.countDocuments({
                authorId: targetMongoId,
                visibility: "public",
            }),
            Post.countDocuments({
                authorId: targetMongoId,
                visibility: "public",
            }),
        ]);

        const savedPromptsCount = targetUser
            ? await Interaction.countDocuments({
                  userId: targetMongoId,
                  interactionType: "SAVE",
                  targetType: "Prompt",
              })
            : 0;

        return res.status(200).json({
            userId,
            followersCount,
            followingCount,
            promptsCount,
            collectionsCount,
            postsCount,
            savedPromptsCount,
        });
    } catch (error) {
        console.log("GET USER PROFILE STATS ERROR:", error);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/users/:userId
 * Fetch user details from Clerk
 */
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        const user = await clerkClient.users.getUser(userId);

        // Also fetch the MongoDB user for bio
        const mongoUser = await User.findOne({ clerkId: userId });

        return res.status(200).json({
            id: user.id,
            username: user.username || null,
            fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            avatar: user.imageUrl || null,
            email: user.emailAddresses?.[0]?.emailAddress || null,
            bio: mongoUser?.bio || "",
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error.message);
        return res.status(500).json({
            message: "Failed to fetch user details",
        });
    }
};

/**
 * GET /api/users/me
 * Get logged in user details from Clerk
 */
export const getMyUser = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await clerkClient.users.getUser(userId);

        return res.status(200).json({
            id: user.id,
            username: user.username || null,
            fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            avatar: user.imageUrl || null,
            email: user.emailAddresses?.[0]?.emailAddress || null,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("GET MY USER ERROR:", error.message);
        return res.status(500).json({
            message: "Failed to fetch user details",
        });
    }
};

/**
 * GET /api/users/:userId/followers
 * Fetch the followers list for a user, resolving each via Clerk
 */
export const getUserFollowers = async (req, res) => {
    try {
        const clerkUserId = req.params.userId;

        if (!clerkUserId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        // Convert Clerk ID to MongoDB ID
        const user = await User.findOne({ clerkId: clerkUserId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // People who follow this user => followingId === user._id
        const followDocs = await Follow.find({ followingId: user._id })
            .sort({ createdAt: -1 })
            .limit(100);

        const followerIds = followDocs.map((f) => f.followerId);

        // Get follower users from MongoDB and resolve via Clerk
        const followerUsers = await User.find({ _id: { $in: followerIds } });
        const followerMap = {};
        followerUsers.forEach((u) => {
            followerMap[u.clerkId] = {
                id: u.clerkId,
                username: u.username || null,
                fullName: u.fullName || null,
                avatar: u.avatar || null,
            };
        });

        return res.status(200).json(Object.values(followerMap));
    } catch (error) {
        console.error("GET FOLLOWERS ERROR:", error.message);
        return res.status(500).json({ message: "Failed to fetch followers" });
    }
};

/**
 * GET /api/users/:userId/following
 * Fetch the following list for a user, resolving each via Clerk
 */
export const getUserFollowing = async (req, res) => {
    try {
        const clerkUserId = req.params.userId;

        if (!clerkUserId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        // Convert Clerk ID to MongoDB ID
        const user = await User.findOne({ clerkId: clerkUserId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // People this user follows => followerId === user._id
        const followDocs = await Follow.find({ followerId: user._id })
            .sort({ createdAt: -1 })
            .limit(100);

        const followingIds = followDocs.map((f) => f.followingId);

        // Get following users from MongoDB
        const followingUsers = await User.find({ _id: { $in: followingIds } });
        const followingMap = {};
        followingUsers.forEach((u) => {
            followingMap[u.clerkId] = {
                id: u.clerkId,
                username: u.username || null,
                fullName: u.fullName || null,
                avatar: u.avatar || null,
            };
        });

        return res.status(200).json(Object.values(followingMap));
    } catch (error) {
        console.error("GET FOLLOWING ERROR:", error.message);
        return res.status(500).json({ message: "Failed to fetch following" });
    }
};

/**
 * GET /api/users/:userId/posts
 * Fetch public posts by a user
 */
export const getUserPosts = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        const targetUser = await User.findOne({ clerkId: userId });
        const targetMongoId = targetUser?._id;

        const posts = await Post.find({
            authorId: targetMongoId,
            visibility: "public",
        })
            .populate("authorId")
            .populate(
                "linkedPromptId",
                "title category modelSupport tags isTemplate _id",
            )
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json(posts);
    } catch (error) {
        console.error("GET USER POSTS ERROR:", error.message);
        return res.status(500).json({ message: "Failed to fetch user posts" });
    }
};
