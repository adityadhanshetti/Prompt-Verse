import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";

// GET /api/notifications (protected)
export const getMyNotifications = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;
        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findOne({ clerkId: clerkUserId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const notifications = await Notification.find({ recipientId: user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const senderIds = [
            ...new Set(
                notifications
                    .map((n) => n.senderId)
                    .filter(Boolean)
                    .map((id) => id.toString()),
            ),
        ];

        const senders = await User.find({
            _id: { $in: senderIds },
        }).lean();

        const senderMap = {};
        senders.forEach((u) => {
            senderMap[u._id.toString()] = {
                id: u.clerkId,
                username: u.username || null,
                fullName: `${u.fullName || ""}`.trim(),
                imageUrl: u.avatar || null,
            };
        });

        const enriched = notifications.map((n) => ({
            ...n,
            fromUser: senderMap[n.senderId?.toString()] || null,
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
        const clerkUserId = req.auth?.userId;

        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findOne({ clerkId: clerkUserId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const count = await Notification.countDocuments({
            recipientId: user._id,
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
        const clerkUserId = req.auth?.userId;

        if (!clerkUserId)
            return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findOne({ clerkId: clerkUserId });
        if (!user) return res.status(404).json({ message: "User not found" });

        await Notification.updateMany(
            { recipientId: user._id, isRead: false },
            { $set: { isRead: true } },
        );

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
