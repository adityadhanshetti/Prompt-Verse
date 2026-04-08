import api from "./api.js";

// GET available models + categories
export const fetchPlaygroundModels = async () => {
    const res = await api.get("/api/playground/models");
    return res.data;
};

// POST run a single model
export const runPlaygroundPrompt = async (payload, token) => {
    const res = await api.post("/api/playground/run", payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        timeout: 300000, // 5 min for large models
    });
    return res.data;
};

// POST compare multiple models
export const runPlaygroundComparison = async (payload, token) => {
    const res = await api.post("/api/playground/compare", payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        timeout: 600000, // 10 min for multi-model
    });
    return res.data;
};
