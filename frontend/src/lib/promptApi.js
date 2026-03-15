import api from "./api.js";

// GET feed
export const fetchPrompts = async () => {
    const res = await api.get("/api/prompts");
    return res.data;
};

// GET trending prompts
export const fetchTrendingPrompts = async ({
    range = "week",
    category,
} = {}) => {
    const params = new URLSearchParams();
    if (range) params.append("range", range);
    if (category) params.append("category", category);
    const res = await api.get(`/api/prompts/trending?${params.toString()}`);
    return res.data;
};

export const fetchPromptsAdvanced = async ({
    search,
    category,
    tag,
    isTemplate,
    model,
    sort,
}) => {
    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (tag) params.append("tag", tag);
    if (isTemplate) params.append("isTemplate", "true");
    if (model) params.append("model", model);
    if (sort) params.append("sort", sort);

    const res = await api.get(`/api/prompts?${params.toString()}`);
    console.log(res.data, "DATA");
    return res.data;
};

// POST create prompt (protected)
export const createPrompt = async (promptData, token) => {
    const res = await api.post("/api/prompts", promptData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(promptData, "Prompt Data");

    return res.data;
};

// GET single prompt
export const fetchPromptById = async (id) => {
    const res = await api.get(`/api/prompts/${id}`);
    return res.data;
};

// PATCH copy count
export const incrementCopyCount = async (id) => {
    const res = await api.patch(`/api/prompts/${id}/copy`);
    return res.data;
};

// POST fork prompt
export const forkPrompt = async (id, token) => {
    const res = await api.post(
        `/api/prompts/${id}/fork`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return res.data;
};

// GET forks list
export const fetchForks = async (id) => {
    const res = await api.get(`/api/prompts/${id}/forks`);
    return res.data;
};

export const fetchVersions = async (id) => {
    const res = await api.get(`/api/prompts/${id}/versions`);
    return res.data;
};

export const restoreVersion = async (id, versionId, token) => {
    const res = await api.post(
        `/api/prompts/${id}/restore/${versionId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return res.data;
};

export const updatePrompt = async (id, data, token) => {
    const res = await api.patch(`/api/prompts/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const fetchPromptsByUserId = async (userId) => {
    const res = await api.get(`/api/prompts/user/${userId}`);
    return res.data;
};

export const fetchMySavedPrompts = async (token) => {
    const res = await api.get("/api/prompts/saved/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

export const deletePromptById = async (id, token) => {
    const res = await api.delete(`/api/prompts/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

// POST optimize prompt
export const optimizePromptText = async (payload, token) => {
    const res = await api.post("/api/prompts/optimize", payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};
