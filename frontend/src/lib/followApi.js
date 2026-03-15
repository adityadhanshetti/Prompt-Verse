import api from "./api.js";

export const followUser = async (userId, token) => {
    const res = await api.post(
        `/api/follow/${userId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return res.data;
};

export const unfollowUser = async (userId, token) => {
    const res = await api.delete(`/api/follow/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const checkFollowing = async (userId, token) => {
    const res = await api.get(`/api/follow/check/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const fetchFollowStats = async (userId) => {
    const res = await api.get(`/api/follow/stats/${userId}`);
    return res.data;
};

export const fetchFollowingFeed = async (token) => {
    const res = await api.get(`/api/follow/feed`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};
