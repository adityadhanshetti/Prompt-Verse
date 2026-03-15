import Notification from "../models/Notification.model.js";

export const createNotification = async ({
    userId,
    fromUserId,
    type,
    promptId = null,
    collectionId = null,
    message = "",
}) => {
    try {
        // prevent self notification
        if (userId === fromUserId) return;

        // prevent duplicate spam notifications (same user, same type, same prompt)
        const exists = await Notification.findOne({
            userId,
            fromUserId,
            type,
            promptId,
            collectionId,
        });

        if (exists) return;

        await Notification.create({
            userId,
            fromUserId,
            type,
            promptId,
            collectionId,
            message,
        });
    } catch (error) {
        console.log("Notification error:", error.message);
    }
};
