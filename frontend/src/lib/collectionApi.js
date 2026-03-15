import api from "./api.js";

export const createCollection = async (data, token) => {
    const res = await api.post("/api/collections", data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const fetchCollectionById = async (id) => {
    const res = await api.get(`/api/collections/${id}`);
    return res.data;
};

export const fetchMyCollections = async (token) => {
    const res = await api.get("/api/collections/my", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const addPromptToCollection = async (collectionId, promptId, token) => {
    const res = await api.post(
        `/api/collections/${collectionId}/add`,
        { promptId },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return res.data;
};

export const removePromptFromCollection = async (
    collectionId,
    promptId,
    token,
) => {
    const res = await api.delete(
        `/api/collections/${collectionId}/remove/${promptId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return res.data;
};

export const reorderCollection = async (collectionId, prompts, token) => {
    const res = await api.patch(
        `/api/collections/${collectionId}/reorder`,
        { prompts },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return res.data;
};

export const fetchCollectionsByUserId = async (userId) => {
    const res = await api.get(`/api/collections/user/${userId}`);
    return res.data;
};

export const fetchCollectionsExplore = async ({ search = "", sort = "new" } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    const res = await api.get(`/api/collections/explore?${params.toString()}`);
    return res.data;
};

export const toggleSaveCollection = async (id, token) => {
    const res = await api.post(
        `/api/collections/${id}/save`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return res.data;
};

export const fetchSavedCollections = async (token) => {
    const res = await api.get("/api/collections/saved", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};

export const deleteCollection = async (id, token) => {
    const res = await api.delete(`/api/collections/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};

