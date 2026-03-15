import express from "express";
import { requireAuth } from "@clerk/express";

import {
    getMyNotifications,
    getUnreadCount,
    markAllRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", requireAuth(), getMyNotifications);
router.get("/unread-count", requireAuth(), getUnreadCount);
router.patch("/mark-all-read", requireAuth(), markAllRead);

export default router;
