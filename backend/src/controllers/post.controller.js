import Post from "../models/Post.model.js";
import Prompt from "../models/Prompt.model.js";
import Follow from "../models/Follow.model.js";
import User from "../models/User.model.js";
import { createNotification } from "../utils/createNotification.js";

// ─── CREATE POST ───────────────────────────────────────────────────────────────
// POST /api/posts  (protected)
export const createPost = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;
        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const mongoUser = await User.findOne({ clerkId: clerkUserId });
        if (!mongoUser)
            return res.status(401).json({ message: "User not found" });

        const { caption, images, linkedPromptId, tags } = req.body;

        if (!caption)
            return res.status(400).json({ message: "Caption is required" });

        // Validate linked prompt (must exist and belong to the user)
        if (linkedPromptId) {
            const prompt = await Prompt.findById(linkedPromptId);
            if (!prompt)
                return res
                    .status(404)
                    .json({ message: "Linked prompt not found" });
            if (prompt.createdByClerkId !== clerkUserId) {
                return res
                    .status(403)
                    .json({ message: "You can only link prompts you created" });
            }
        }

        const post = await Post.create({
            createdByClerkId: clerkUserId,
            createdByMongoDBObjectId: mongoUser._id,
            caption,
            images: images || [],
            linkedPromptId: linkedPromptId || null,
            tags: tags || [],
        });

        const populated = await Post.findById(post._id)
            .populate("createdByMongoDBObjectId")
            .populate("linkedPromptId", "title category modelSupport");

        res.status(201).json(populated);
    } catch (error) {
        console.error("CREATE POST ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ─── GET ALL POSTS (PUBLIC FEED) ───────────────────────────────────────────────
// GET /api/posts?page=1
export const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const posts = await Post.find({ visibility: "public" })
            .populate("createdByMongoDBObjectId")
            .populate(
                "linkedPromptId",
                "title category modelSupport tags isTemplate _id",
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({ visibility: "public" });

        res.json({ posts, total, page, hasMore: skip + posts.length < total });
    } catch (error) {
        console.error("GET POSTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ─── GET FOLLOWING-ONLY FEED ───────────────────────────────────────────────────
// GET /api/posts/following  (protected)
export const getFollowingPosts = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;
        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const mongoUser = await User.findOne({ clerkId: clerkUserId });
        if (!mongoUser)
            return res.status(401).json({ message: "User not found" });

        // Find who I follow (Follow model uses Clerk userIds)
        const followDocs = await Follow.find({
            followerId: clerkUserId,
        }).select("followingId");
        const followingClerkIds = followDocs.map((f) => f.followingId);

        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const posts = await Post.find({
            createdByClerkId: { $in: followingClerkIds },
            visibility: "public",
        })
            .populate("createdByMongoDBObjectId")
            .populate(
                "linkedPromptId",
                "title category modelSupport tags isTemplate _id",
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({
            createdByClerkId: { $in: followingClerkIds },
            visibility: "public",
        });

        res.json({ posts, total, page, hasMore: skip + posts.length < total });
    } catch (error) {
        console.error("FOLLOWING POSTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ─── GET MY POSTS ──────────────────────────────────────────────────────────────
// GET /api/posts/me  (protected)
export const getMyPosts = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;
        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const posts = await Post.find({ createdByClerkId: clerkUserId })
            .populate("createdByMongoDBObjectId")
            .populate(
                "linkedPromptId",
                "title category modelSupport tags isTemplate _id",
            )
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        console.error("MY POSTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ─── TOGGLE LIKE ───────────────────────────────────────────────────────────────
// POST /api/posts/:id/like  (protected)
export const toggleLikePost = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;
        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const alreadyLiked = post.likedBy.includes(clerkUserId);

        if (alreadyLiked) {
            post.likedBy = post.likedBy.filter((id) => id !== clerkUserId);
            post.likesCount = Math.max(0, post.likesCount - 1);
        } else {
            post.likedBy.push(clerkUserId);
            post.likesCount += 1;

            if (post.createdByClerkId !== clerkUserId) {
                await createNotification({
                    userId: post.createdByClerkId,
                    fromUserId: clerkUserId,
                    type: "like",
                    promptId: post.linkedPromptId,
                    message: "liked your post",
                });
            }
        }

        await post.save();
        res.json({ liked: !alreadyLiked, likesCount: post.likesCount });
    } catch (error) {
        console.error("LIKE POST ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ─── DELETE POST ───────────────────────────────────────────────────────────────
// DELETE /api/posts/:id  (protected)
export const deletePost = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;
        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.createdByClerkId !== clerkUserId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Post deleted" });
    } catch (error) {
        console.error("DELETE POST ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ─── GET USER'S PROMPTS (for linking) ──────────────────────────────────────────
// GET /api/posts/my-prompts  (protected)
export const getMyPromptsForLinking = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;
        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const prompts = await Prompt.find({ createdByClerkId: clerkUserId })
            .select("title category modelSupport _id")
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(prompts);
    } catch (error) {
        console.error("MY PROMPTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};
