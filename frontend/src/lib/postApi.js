import api from "./api.js";

// GET all public posts
export const fetchAllPosts = async (page = 1) => {
    const res = await api.get(`/api/posts?page=${page}`);
    return res.data;
};

// GET following-only posts
export const fetchFollowingPosts = async (token, page = 1) => {
    const res = await api.get(`/api/posts/following?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// POST create a new post
export const createPost = async (data, token) => {
    const res = await api.post("/api/posts", data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// POST toggle like
export const toggleLikePost = async (id, token) => {
    const res = await api.post(
        `/api/posts/${id}/like`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` },
        },
    );
    return res.data;
};

// DELETE a post
export const deletePost = async (id, token) => {
    const res = await api.delete(`/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// GET my prompts for linking
export const fetchMyPromptsForLinking = async (token) => {
    const res = await api.get("/api/posts/my-prompts", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};
