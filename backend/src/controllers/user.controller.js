import Prompt from "../models/Prompt.model.js";
import Post from "../models/Post.model.js";
import Collection from "../models/Collection.model.js";
import Follow from "../models/Follow.model.js";
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

        const [
            followersCount,
            followingCount,
            promptsCount,
            collectionsCount,
            postsCount,
        ] = await Promise.all([
            Follow.countDocuments({ followingId: userId }),
            Follow.countDocuments({ followerId: userId }),
            Prompt.countDocuments({
                createdByClerkId: userId,
                visibility: "public",
            }),
            Collection.countDocuments({
                createdByClerkId: userId,
                visibility: "public",
            }),
            Post.countDocuments({
                createdByClerkId: userId,
                visibility: "public",
            }),
        ]);

        // Count saved prompts (prompts where this user is in savedBy array)
        const savedPromptsCount = await Prompt.countDocuments({
            savedBy: { $in: [userId] },
        });

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
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        // People who follow this user => followingId === userId
        const followDocs = await Follow.find({ followingId: userId })
            .sort({ createdAt: -1 })
            .limit(100);

        const followerIds = followDocs.map((f) => f.followerId);

        // Resolve each follower via Clerk (batch)
        const followers = [];
        for (const fId of followerIds) {
            try {
                const u = await clerkClient.users.getUser(fId);
                followers.push({
                    id: u.id,
                    username: u.username || null,
                    fullName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
                    avatar: u.imageUrl || null,
                });
            } catch {
                // Skip if the user can't be found
            }
        }

        return res.status(200).json(followers);
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
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        // People this user follows => followerId === userId
        const followDocs = await Follow.find({ followerId: userId })
            .sort({ createdAt: -1 })
            .limit(100);

        const followingIds = followDocs.map((f) => f.followingId);

        const following = [];
        for (const fId of followingIds) {
            try {
                const u = await clerkClient.users.getUser(fId);
                following.push({
                    id: u.id,
                    username: u.username || null,
                    fullName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
                    avatar: u.imageUrl || null,
                });
            } catch {
                // Skip if the user can't be found
            }
        }

        return res.status(200).json(following);
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

        const posts = await Post.find({
            createdByClerkId: userId,
            visibility: "public",
        })
            .populate("createdByMongoDBObjectId")
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
