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
    return res.data;
};

// POST create prompt (protected)
export const createPrompt = async (promptData, token) => {
    const res = await api.post("/api/prompts", promptData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};

// GET single prompt
export const fetchPromptById = async (id) => {
    const res = await api.get(`/api/prompts/${id}`);
    return res.data;
};

// POST copy count
export const incrementCopyCount = async (id) => {
    const res = await api.post(`/api/prompts/${id}/copy`);
    return res.data;
};

// POST fork prompt (with optional customization)
export const forkPrompt = async (id, token, data = {}) => {
    const res = await api.post(
        `/api/prompts/${id}/fork`,
        data,
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
    return res.data; // { forks: [...], totalForks: N }
};

export const fetchVersions = async (id) => {
    const res = await api.get(`/api/prompts/${id}/versions`);
    return res.data; // { versions: [...], totalVersions: N }
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

// POST optimize prompt (Ollama dual-LLM pipeline — may take several minutes)
export const optimizePromptText = async (payload, token) => {
    const res = await api.post("/api/prompts/optimize", payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        timeout: 600000, // 10 min — pipeline may retry up to 3 attempts
    });
    return res.data;
};

// POST toggle like prompt (protected)
export const toggleLikePrompt = async (id, token) => {
    const res = await api.post(
        `/api/prompts/${id}/like`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return res.data;
};

// POST toggle save prompt (protected)
export const toggleSavePrompt = async (id, token) => {
    const res = await api.post(
        `/api/prompts/${id}/save`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return res.data;
};
