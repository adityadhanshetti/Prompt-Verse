import express from "express";
import {
    createPost,
    getAllPosts,
    getFollowingPosts,
    getMyPosts,
    toggleLikePost,
    deletePost,
    getMyPromptsForLinking,
} from "../controllers/post.controller.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const router = express.Router();

// Protected routes
router.post("/", requireAuth(), createPost);
router.get("/following", requireAuth(), getFollowingPosts);
router.get("/me", requireAuth(), getMyPosts);
router.get("/my-prompts", requireAuth(), getMyPromptsForLinking);
router.post("/:id/like", requireAuth(), toggleLikePost);
router.delete("/:id", requireAuth(), deletePost);

// Public
router.get("/", getAllPosts);

export default router;
