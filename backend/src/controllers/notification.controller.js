import Notification from "../models/Notification.model.js";
import { clerkClient } from "@clerk/express";

// GET /api/notifications (protected)
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Collect unique fromUserIds
        const userIds = [
            ...new Set(notifications.map((n) => n.fromUserId).filter(Boolean)),
        ];

        let userMap = {};

        if (userIds.length > 0) {
            // Fetch only required Clerk users
            const clerkUsers = await clerkClient.users.getUserList({
                userId: userIds,
            });

            clerkUsers.data.forEach((u) => {
                userMap[u.id] = {
                    id: u.id,
                    username: u.username || null,
                    fullName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
                    imageUrl: u.imageUrl,
                };
            });
        }

        // Attach sender info
        const enriched = notifications.map((n) => ({
            ...n,
            fromUser: userMap[n.fromUserId] || null,
        }));

        res.json(enriched);
    } catch (error) {
        console.log("GET NOTIFICATIONS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/notifications/unread-count (protected)
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const count = await Notification.countDocuments({
            userId,
            isRead: false,
        });

        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/notifications/mark-all-read (protected)
export const markAllRead = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        await Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } },
        );

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
