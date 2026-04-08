import {
    getAvailableModels,
    runPlaygroundPrompt,
    runMultiModelComparison,
    OLLAMA_MODEL_CATALOG,
    MODEL_CATEGORIES,
} from "../services/playgroundService.js";

// GET /api/playground/models
// Returns the model catalog enriched with availability status
export const getPlaygroundModels = async (req, res) => {
    try {
        const models = await getAvailableModels();
        res.json({
            models,
            categories: MODEL_CATEGORIES,
        });
    } catch (error) {
        console.error("PLAYGROUND MODELS ERROR:", error);

        // If Ollama is down, still return catalog (all unavailable)
        if (
            error.message?.includes("not running") ||
            error.code === "ECONNREFUSED"
        ) {
            return res.json({
                models: OLLAMA_MODEL_CATALOG.map((m) => ({
                    ...m,
                    available: false,
                })),
                categories: MODEL_CATEGORIES,
                warning: "Ollama is not running. Models shown but unavailable.",
            });
        }

        res.status(500).json({ message: error.message });
    }
};

// POST /api/playground/run
// Runs a prompt against a single model
export const runSingleModel = async (req, res) => {
    try {
        const { model, prompt, systemPrompt, options } = req.body;

        if (!model || !prompt) {
            return res
                .status(400)
                .json({ message: "Model and prompt are required" });
        }

        const result = await runPlaygroundPrompt(
            model,
            prompt,
            systemPrompt,
            options,
        );

        res.json(result);
    } catch (error) {
        console.error("PLAYGROUND RUN ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// POST /api/playground/compare
// Runs a prompt against multiple models sequentially
export const runComparison = async (req, res) => {
    try {
        const { models, prompt, systemPrompt, options } = req.body;

        if (!models?.length || !prompt) {
            return res
                .status(400)
                .json({ message: "Models array and prompt are required" });
        }

        if (models.length > 4) {
            return res
                .status(400)
                .json({
                    message:
                        "Maximum 4 models can be compared at once to prevent overload",
                });
        }

        const results = await runMultiModelComparison(
            models,
            prompt,
            systemPrompt,
            options,
        );

        res.json({ results });
    } catch (error) {
        console.error("PLAYGROUND COMPARE ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};
