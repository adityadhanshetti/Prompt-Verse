import Notification from "../models/Notification.model.js";

export const createNotification = async ({
    recipientId,
    senderId,
    type,
    targetId = null,
    targetType = null,
    message = "",
}) => {
    try {
        if (!recipientId || !senderId) return;
        if (recipientId.toString() === senderId.toString()) return;

        // Auto-derive promptId / collectionId from targetId + targetType
        const promptId = targetType === "Prompt" ? targetId : null;
        const collectionId = targetType === "Collection" ? targetId : null;

        const defaultMessages = {
            follow: "started following you",
            like: "liked your prompt",
            fork: "forked your prompt",
            save: "saved your prompt",
            collection_add: "added your prompt to a collection",
        };

        if (!message) {
            message = defaultMessages[type] || `${type} notification`;
        }

        const query = {
            recipientId,
            senderId,
            type,
        };

        if (promptId) query.promptId = promptId;
        if (collectionId) query.collectionId = collectionId;

        const exists = await Notification.findOne(query);
        if (exists) return;

        await Notification.create({
            recipientId,
            senderId,
            type,
            promptId,
            collectionId,
            message,
        });
    } catch (error) {
        console.log("Notification error:", error.message);
    }
};
