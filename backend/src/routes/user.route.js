import express from "express";
import {
    getMyUser,
    getUserById,
    getUserProfileStats,
    getUserFollowers,
    getUserFollowing,
    getUserPosts,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const router = express.Router();

// Authenticated user
router.get("/me", requireAuth(), getMyUser);

// Public profile data
router.get("/:userId/profile", getUserProfileStats);
router.get("/:userId/followers", getUserFollowers);
router.get("/:userId/following", getUserFollowing);
router.get("/:userId/posts", getUserPosts);
router.get("/:userId", getUserById);

export default router;
