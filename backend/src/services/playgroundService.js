import axios from "axios";
import { config } from "dotenv";
config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 300000;

// ─── Curated Ollama Model Catalog ───────────────────────────────────────────────
// Each model is categorized for easy discovery in the playground UI.
// The user will need to `ollama pull <model>` before using any of these.

export const OLLAMA_MODEL_CATALOG = [
    // ── Coding ──────────────────────────────────────────────────────────────────
    {
        id: "deepseek-coder-v2:16b",
        name: "DeepSeek Coder V2",
        size: "16B",
        category: "coding",
        description: "Exceptional code generation, debugging, and refactoring across 300+ languages",
        strengths: ["Code generation", "Debugging", "Multi-language"],
    },
    {
        id: "codellama:13b",
        name: "Code Llama",
        size: "13B",
        category: "coding",
        description: "Meta's specialized coding model built on Llama 2 with code infilling",
        strengths: ["Code completion", "Infilling", "Python"],
    },
    {
        id: "codegemma:7b",
        name: "CodeGemma",
        size: "7B",
        category: "coding",
        description: "Google's lightweight code model with strong fill-in-the-middle capabilities",
        strengths: ["Fast inference", "FIM", "Code completion"],
    },
    {
        id: "starcoder2:7b",
        name: "StarCoder 2",
        size: "7B",
        category: "coding",
        description: "BigCode's powerful open code LLM trained on The Stack v2",
        strengths: ["Multi-language", "Code search", "Completion"],
    },
    {
        id: "qwen2.5-coder:7b",
        name: "Qwen 2.5 Coder",
        size: "7B",
        category: "coding",
        description: "Alibaba's coding specialist with strong benchmark performance",
        strengths: ["Code generation", "Bug fixing", "Explanation"],
    },

    // ── Reasoning ───────────────────────────────────────────────────────────────
    {
        id: "deepseek-r1:8b",
        name: "DeepSeek R1",
        size: "8B",
        category: "reasoning",
        description: "Advanced chain-of-thought reasoning with transparent thinking process",
        strengths: ["Step-by-step reasoning", "Math", "Logic"],
    },
    {
        id: "deepseek-r1:14b",
        name: "DeepSeek R1 14B",
        size: "14B",
        category: "reasoning",
        description: "Larger R1 variant with enhanced reasoning depth and accuracy",
        strengths: ["Complex reasoning", "Analysis", "Problem solving"],
    },
    {
        id: "wizard-math:7b",
        name: "WizardMath",
        size: "7B",
        category: "reasoning",
        description: "Specialized math reasoning model with strong GSM8K performance",
        strengths: ["Mathematics", "Word problems", "Calculations"],
    },

    // ── Fast ────────────────────────────────────────────────────────────────────
    {
        id: "llama3.2:3b",
        name: "Llama 3.2 3B",
        size: "3B",
        category: "fast",
        description: "Ultra-lightweight Meta model for instant responses on any hardware",
        strengths: ["Speed", "Low memory", "General tasks"],
    },
    {
        id: "phi3:mini",
        name: "Phi-3 Mini",
        size: "3.8B",
        category: "fast",
        description: "Microsoft's compact powerhouse punching above its weight class",
        strengths: ["Fast", "Efficient", "Reasoning"],
    },
    {
        id: "gemma2:2b",
        name: "Gemma 2 2B",
        size: "2B",
        category: "fast",
        description: "Google's ultra-compact model with surprising capability for its size",
        strengths: ["Ultra fast", "Minimal resources", "Summarization"],
    },
    {
        id: "qwen2.5:3b",
        name: "Qwen 2.5 3B",
        size: "3B",
        category: "fast",
        description: "Alibaba's efficient small model with multilingual fluency",
        strengths: ["Speed", "Multilingual", "Instruction following"],
    },
    {
        id: "tinyllama:1.1b",
        name: "TinyLlama",
        size: "1.1B",
        category: "fast",
        description: "Extremely fast model for basic tasks and rapid prototyping",
        strengths: ["Blazing fast", "Minimal RAM", "Basic tasks"],
    },

    // ── Planning ────────────────────────────────────────────────────────────────
    {
        id: "llama3.1:8b",
        name: "Llama 3.1 8B",
        size: "8B",
        category: "planning",
        description: "Meta's versatile model excellent at structured planning and organization",
        strengths: ["Planning", "Instruction following", "General"],
    },
    {
        id: "mistral:7b",
        name: "Mistral 7B",
        size: "7B",
        category: "planning",
        description: "Efficient and capable model with strong planning and analytical skills",
        strengths: ["Analysis", "Planning", "Versatility"],
    },
    {
        id: "gemma2:9b",
        name: "Gemma 2 9B",
        size: "9B",
        category: "planning",
        description: "Google's well-rounded model with strong structured output capabilities",
        strengths: ["Structured output", "Planning", "Clarity"],
    },

    // ── General ─────────────────────────────────────────────────────────────────
    {
        id: "llama3.1:70b",
        name: "Llama 3.1 70B",
        size: "70B",
        category: "general",
        description: "Meta's flagship open model — top-tier across all benchmarks",
        strengths: ["Best quality", "Creative writing", "Complex tasks"],
    },
    {
        id: "mixtral:8x7b",
        name: "Mixtral 8x7B",
        size: "8x7B",
        category: "general",
        description: "Mistral's MoE architecture — fast inference with large model quality",
        strengths: ["MoE efficiency", "Multi-task", "Quality"],
    },
    {
        id: "qwen2.5:7b",
        name: "Qwen 2.5 7B",
        size: "7B",
        category: "general",
        description: "Alibaba's all-around strong model with multilingual excellence",
        strengths: ["Multilingual", "Balanced", "Versatile"],
    },
    {
        id: "nous-hermes2:10.7b",
        name: "Nous Hermes 2",
        size: "10.7B",
        category: "general",
        description: "Community fine-tune with excellent instruction following and creativity",
        strengths: ["Creative", "Roleplay", "Instruction following"],
    },
];

// ─── Category Metadata ──────────────────────────────────────────────────────────
export const MODEL_CATEGORIES = {
    coding: {
        label: "Coding",
        emoji: "💻",
        color: "#38bdf8",
        description: "Optimized for code generation, debugging, and software development",
    },
    reasoning: {
        label: "Reasoning",
        emoji: "🧠",
        color: "#a78bfa",
        description: "Deep chain-of-thought reasoning, math, and logical analysis",
    },
    fast: {
        label: "Fast",
        emoji: "⚡",
        color: "#fbbf24",
        description: "Lightweight models for instant responses with minimal resources",
    },
    planning: {
        label: "Planning",
        emoji: "📋",
        color: "#34d399",
        description: "Structured planning, organization, and analytical tasks",
    },
    general: {
        label: "General",
        emoji: "🌐",
        color: "#60a5fa",
        description: "Versatile all-purpose models for any kind of task",
    },
};

// ─── Check which models are actually available in Ollama ────────────────────────
export async function getAvailableModels() {
    try {
        const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
            timeout: 5000,
        });
        const installedModels = response.data.models?.map((m) => m.name) || [];

        // Enrich catalog with availability info
        return OLLAMA_MODEL_CATALOG.map((model) => {
            const isAvailable = installedModels.some(
                (installed) =>
                    installed === model.id ||
                    installed.startsWith(model.id.split(":")[0]),
            );
            return { ...model, available: isAvailable };
        });
    } catch (error) {
        if (error.code === "ECONNREFUSED") {
            throw new Error(
                "Ollama is not running. Start it with: ollama serve",
            );
        }
        throw error;
    }
}

// ─── Run a single prompt against a model (non-streaming) ────────────────────────
export async function runPlaygroundPrompt(
    model,
    prompt,
    systemPrompt,
    options = {},
) {
    const {
        temperature = 0.7,
        maxTokens = 2048,
        topP = 0.9,
    } = options;

    const startTime = Date.now();

    try {
        const messages = [];
        if (systemPrompt?.trim()) {
            messages.push({ role: "system", content: systemPrompt });
        }
        messages.push({ role: "user", content: prompt });

        const response = await axios.post(
            `${OLLAMA_BASE_URL}/api/chat`,
            {
                model,
                messages,
                stream: false,
                options: {
                    temperature,
                    num_predict: maxTokens,
                    top_p: topP,
                },
            },
            { timeout: OLLAMA_TIMEOUT },
        );

        const elapsed = Date.now() - startTime;
        const content = response.data.message?.content || "";

        return {
            model,
            content,
            duration: elapsed,
            tokensPerSecond: response.data.eval_count
                ? (
                      response.data.eval_count /
                      (response.data.eval_duration / 1e9)
                  ).toFixed(1)
                : null,
            totalTokens: response.data.eval_count || null,
            status: "success",
        };
    } catch (error) {
        const elapsed = Date.now() - startTime;

        if (error.response?.status === 404) {
            return {
                model,
                content: "",
                duration: elapsed,
                status: "error",
                error: `Model '${model}' not found. Run: ollama pull ${model}`,
            };
        }
        if (error.code === "ECONNREFUSED") {
            return {
                model,
                content: "",
                duration: elapsed,
                status: "error",
                error: "Ollama is not running. Start it with: ollama serve",
            };
        }

        return {
            model,
            content: "",
            duration: elapsed,
            status: "error",
            error: error.message || "Unknown error occurred",
        };
    }
}

// ─── Run prompt against multiple models (sequentially to avoid overload) ────────
export async function runMultiModelComparison(
    models,
    prompt,
    systemPrompt,
    options = {},
) {
    const results = [];

    // Run sequentially to avoid overwhelming Ollama / GPU
    for (const model of models) {
        const result = await runPlaygroundPrompt(
            model,
            prompt,
            systemPrompt,
            options,
        );
        results.push(result);
    }

    return results;
}
