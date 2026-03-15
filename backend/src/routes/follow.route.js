import express from "express";
import { requireAuth } from "@clerk/express";

import {
    followUser,
    unfollowUser,
    getFollowStats,
    checkFollowing,
    getFollowingFeed,
} from "../controllers/follow.controller.js";

const router = express.Router();

router.post("/:userId", requireAuth(), followUser);
router.delete("/:userId", requireAuth(), unfollowUser);

router.get("/stats/:userId", getFollowStats);
router.get("/check/:userId", requireAuth(), checkFollowing);

router.get("/feed", requireAuth(), getFollowingFeed);

export default router;
