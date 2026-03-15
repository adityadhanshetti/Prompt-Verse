import api from "./api.js";

export const fetchNotifications = async (token) => {
    const res = await api.get("/api/notifications", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const fetchUnreadCount = async (token) => {
    const res = await api.get("/api/notifications/unread-count", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const markAllRead = async (token) => {
    const res = await api.patch(
        "/api/notifications/mark-all-read",
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return res.data;
};
