import api from "./api.js";

export const fetchUserProfileStats = async (userId) => {
    const res = await api.get(`/api/users/${userId}/profile`);
    return res.data;
};

export const getUserByUserId = async (userId) => {
    const res = await api.get(`/api/users/${userId}`);
    return res.data;
};

export const fetchUserFollowers = async (userId) => {
    const res = await api.get(`/api/users/${userId}/followers`);
    return res.data;
};

export const fetchUserFollowing = async (userId) => {
    const res = await api.get(`/api/users/${userId}/following`);
    return res.data;
};

export const fetchUserPosts = async (userId) => {
    const res = await api.get(`/api/users/${userId}/posts`);
    return res.data;
};

export const fetchSavedPromptsByUser = async (token) => {
    const res = await api.get("/api/prompts/saved/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};
