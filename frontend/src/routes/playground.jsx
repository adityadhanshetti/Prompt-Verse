import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    SignedIn,
    SignedOut,
    RedirectToSignIn,
    useAuth,
} from "@clerk/clerk-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Play,
    Zap,
    Brain,
    Code,
    Sparkles,
    Clock,
    Check,
    X,
    ChevronDown,
    Copy,
    RotateCcw,
    Loader2,
    AlertCircle,
    Settings2,
    GitCompareArrows,
    Cpu,
    Gauge,
    Terminal,
    Layers,
    Info,
    CircleDot,
} from "lucide-react";
import { z } from "zod";
import {
    fetchPlaygroundModels,
    runPlaygroundPrompt,
    runPlaygroundComparison,
} from "../lib/playgroundApi.js";

export const Route = createFileRoute("/playground")({
    validateSearch: z.object({
        text: z.string().optional().catch(""),
    }),
    component: PlaygroundPage,
});

// ─── Category Config (mirrors backend) ──────────────────────────────────────────
const CATEGORY_CONFIG = {
    coding: { label: "Coding", emoji: "💻", color: "#38bdf8", icon: Code },
    reasoning: {
        label: "Reasoning",
        emoji: "🧠",
        color: "#a78bfa",
        icon: Brain,
    },
    fast: { label: "Fast", emoji: "⚡", color: "#fbbf24", icon: Zap },
    planning: {
        label: "Planning",
        emoji: "📋",
        color: "#34d399",
        icon: Layers,
    },
    general: {
        label: "General",
        emoji: "🌐",
        color: "#60a5fa",
        icon: Sparkles,
    },
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
function PlaygroundPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-200">
            <SignedIn>
                <PlaygroundContent />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function PlaygroundContent() {
    const { getToken } = useAuth();
    const search = Route.useSearch();

    // ─── State ──────────────────────────────────────────────────────────────
    const [prompt, setPrompt] = useState(search.text || "");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [showSystemPrompt, setShowSystemPrompt] = useState(false);
    const [selectedModels, setSelectedModels] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [results, setResults] = useState([]);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [copied, setCopied] = useState(null);
    const [runningModels, setRunningModels] = useState(new Set());

    // Settings
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2048);

    const promptRef = useRef(null);

    // ─── Fetch Models ───────────────────────────────────────────────────────
    const {
        data: modelData,
        isLoading: modelsLoading,
        error: modelsError,
    } = useQuery({
        queryKey: ["playgroundModels"],
        queryFn: fetchPlaygroundModels,
        staleTime: 60000, // cache for 1 min
        refetchOnWindowFocus: false,
    });

    const models = modelData?.models || [];
    const warning = modelData?.warning;

    // ─── Filtered Models ────────────────────────────────────────────────────
    const filteredModels = useMemo(() => {
        if (activeCategory === "all") return models;
        return models.filter((m) => m.category === activeCategory);
    }, [models, activeCategory]);

    // ─── Category Counts ────────────────────────────────────────────────────
    const categoryCounts = useMemo(() => {
        const counts = { all: models.length };
        for (const m of models) {
            counts[m.category] = (counts[m.category] || 0) + 1;
        }
        return counts;
    }, [models]);

    // ─── Toggle Model Selection ─────────────────────────────────────────────
    const toggleModel = useCallback(
        (modelId) => {
            setSelectedModels((prev) => {
                if (prev.includes(modelId)) {
                    return prev.filter((id) => id !== modelId);
                }
                if (isCompareMode && prev.length >= 4) {
                    return prev; // Max 4 for comparison
                }
                if (!isCompareMode) {
                    return [modelId]; // Single select
                }
                return [...prev, modelId];
            });
        },
        [isCompareMode],
    );

    // Reset selected models when toggling compare mode
    useEffect(() => {
        setSelectedModels([]);
        setResults([]);
    }, [isCompareMode]);

    // ─── Run Single Model ───────────────────────────────────────────────────
    const runSingleMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const modelId = selectedModels[0];
            setRunningModels(new Set([modelId]));
            return runPlaygroundPrompt(
                {
                    model: modelId,
                    prompt,
                    systemPrompt: showSystemPrompt ? systemPrompt : "",
                    options: { temperature, maxTokens },
                },
                token,
            );
        },
        onSuccess: (data) => {
            setResults([data]);
            setRunningModels(new Set());
        },
        onError: (error) => {
            setResults([
                {
                    model: selectedModels[0],
                    status: "error",
                    error: error.message,
                    duration: 0,
                },
            ]);
            setRunningModels(new Set());
        },
    });

    // ─── Run Comparison ─────────────────────────────────────────────────────
    const runComparisonMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            setRunningModels(new Set(selectedModels));
            return runPlaygroundComparison(
                {
                    models: selectedModels,
                    prompt,
                    systemPrompt: showSystemPrompt ? systemPrompt : "",
                    options: { temperature, maxTokens },
                },
                token,
            );
        },
        onSuccess: (data) => {
            setResults(data.results);
            setRunningModels(new Set());
        },
        onError: (error) => {
            setResults(
                selectedModels.map((m) => ({
                    model: m,
                    status: "error",
                    error: error.message,
                    duration: 0,
                })),
            );
            setRunningModels(new Set());
        },
    });

    const isRunning =
        runSingleMutation.isPending || runComparisonMutation.isPending;

    const handleRun = () => {
        if (!prompt.trim() || selectedModels.length === 0) return;
        setResults([]);
        if (isCompareMode && selectedModels.length > 1) {
            runComparisonMutation.mutate();
        } else {
            runSingleMutation.mutate();
        }
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopied(idx);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleClear = () => {
        setPrompt("");
        setSystemPrompt("");
        setResults([]);
        setRunningModels(new Set());
    };

    const getModelInfo = (modelId) => models.find((m) => m.id === modelId);

    // ─── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                        <Terminal size={20} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-[0.2em]">
                            <Cpu size={12} />
                            AI Playground
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">
                            Prompt Playground
                        </h1>
                    </div>
                </div>
                <p className="text-slate-500 text-sm ml-[52px]">
                    Test prompts against local Ollama models. Compare outputs
                    side-by-side.
                </p>
            </header>

            {/* Warning Banner */}
            {warning && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{warning}</span>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* ─── Left Panel: Input + Models ────────────────────────────── */}
                <div className="xl:col-span-5 space-y-5">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/10 rounded-2xl">
                        <button
                            onClick={() => setIsCompareMode(false)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                !isCompareMode
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <Play size={14} />
                            Single Model
                        </button>
                        <button
                            onClick={() => setIsCompareMode(true)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                isCompareMode
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <GitCompareArrows size={14} />
                            Compare Models
                        </button>
                    </div>

                    {/* Prompt Input */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                        {/* System Prompt Toggle */}
                        <button
                            onClick={() =>
                                setShowSystemPrompt(!showSystemPrompt)
                            }
                            className="w-full flex items-center gap-2 px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 hover:bg-white/[0.02] transition-all border-b border-white/5"
                        >
                            <Settings2 size={12} />
                            System Prompt
                            <ChevronDown
                                size={12}
                                className={`ml-auto transition-transform duration-200 ${showSystemPrompt ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showSystemPrompt && (
                            <div className="border-b border-white/5">
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) =>
                                        setSystemPrompt(e.target.value)
                                    }
                                    placeholder="You are a helpful assistant..."
                                    rows={3}
                                    className="w-full bg-transparent px-5 py-4 text-sm text-slate-300 placeholder:text-slate-700 outline-none resize-none font-mono leading-relaxed"
                                />
                            </div>
                        )}

                        {/* Main Prompt */}
                        <div className="px-5 pt-4 pb-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                Your Prompt
                            </label>
                        </div>
                        <textarea
                            ref={promptRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Write your prompt here and test it against different models..."
                            rows={8}
                            className="w-full bg-transparent px-5 pb-4 text-sm text-white placeholder:text-slate-700 outline-none resize-none font-mono leading-relaxed"
                            onKeyDown={(e) => {
                                if (
                                    (e.metaKey || e.ctrlKey) &&
                                    e.key === "Enter"
                                ) {
                                    e.preventDefault();
                                    handleRun();
                                }
                            }}
                        />

                        {/* Action Bar */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/[0.01]">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setShowSettings(!showSettings)
                                    }
                                    className={`p-2 rounded-lg text-slate-500 hover:text-white transition-colors ${showSettings ? "bg-white/10 text-white" : "hover:bg-white/5"}`}
                                >
                                    <Settings2 size={14} />
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <RotateCcw size={14} />
                                </button>
                                <span className="text-[10px] text-slate-700 font-mono">
                                    Ctrl+Enter to run
                                </span>
                            </div>

                            <button
                                onClick={handleRun}
                                disabled={
                                    isRunning ||
                                    !prompt.trim() ||
                                    selectedModels.length === 0
                                }
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {isRunning ? (
                                    <>
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play size={14} />
                                        {isCompareMode
                                            ? `Compare (${selectedModels.length})`
                                            : "Run"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Gauge size={12} />
                                Parameters
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs text-slate-400 font-medium">
                                            Temperature
                                        </label>
                                        <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                                            {temperature}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) =>
                                            setTemperature(
                                                parseFloat(e.target.value),
                                            )
                                        }
                                        className="w-full accent-violet-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-700 mt-1">
                                        <span>Focused</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs text-slate-400 font-medium">
                                            Max Tokens
                                        </label>
                                        <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                                            {maxTokens}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="256"
                                        max="8192"
                                        step="256"
                                        value={maxTokens}
                                        onChange={(e) =>
                                            setMaxTokens(
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className="w-full accent-violet-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-700 mt-1">
                                        <span>256</span>
                                        <span>8192</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Model Selector */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 pt-5 pb-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Cpu size={12} />
                                    {isCompareMode
                                        ? "Select Models (max 4)"
                                        : "Select Model"}
                                </h3>
                                {isCompareMode && selectedModels.length > 0 && (
                                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-md">
                                        {selectedModels.length}/4 selected
                                    </span>
                                )}
                            </div>

                            {/* Category Tabs */}
                            <div className="flex gap-1 flex-wrap">
                                <CategoryTab
                                    label="All"
                                    active={activeCategory === "all"}
                                    count={categoryCounts.all || 0}
                                    onClick={() => setActiveCategory("all")}
                                    color="#94a3b8"
                                />
                                {Object.entries(CATEGORY_CONFIG).map(
                                    ([key, cfg]) => (
                                        <CategoryTab
                                            key={key}
                                            label={`${cfg.emoji} ${cfg.label}`}
                                            active={activeCategory === key}
                                            count={categoryCounts[key] || 0}
                                            onClick={() =>
                                                setActiveCategory(key)
                                            }
                                            color={cfg.color}
                                        />
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Model List */}
                        <div className="px-3 pb-3 max-h-[420px] overflow-y-auto scrollbar-thin">
                            {modelsLoading ? (
                                <div className="flex items-center justify-center py-12 text-slate-600">
                                    <Loader2
                                        size={20}
                                        className="animate-spin mr-2"
                                    />
                                    Loading models…
                                </div>
                            ) : modelsError ? (
                                <div className="flex items-center gap-2 px-4 py-8 text-red-400 text-sm justify-center">
                                    <AlertCircle size={16} />
                                    Failed to load models
                                </div>
                            ) : filteredModels.length === 0 ? (
                                <div className="text-center py-8 text-slate-600 text-sm">
                                    No models in this category
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredModels.map((model) => (
                                        <ModelCard
                                            key={model.id}
                                            model={model}
                                            selected={selectedModels.includes(
                                                model.id,
                                            )}
                                            isCompare={isCompareMode}
                                            isRunning={runningModels.has(
                                                model.id,
                                            )}
                                            onClick={() =>
                                                toggleModel(model.id)
                                            }
                                            disabled={
                                                isCompareMode &&
                                                selectedModels.length >= 4 &&
                                                !selectedModels.includes(
                                                    model.id,
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Right Panel: Results ───────────────────────────────────── */}
                <div className="xl:col-span-7">
                    {results.length === 0 && !isRunning ? (
                        <EmptyState isCompareMode={isCompareMode} />
                    ) : isRunning && results.length === 0 ? (
                        <RunningState
                            models={selectedModels}
                            getModelInfo={getModelInfo}
                        />
                    ) : (
                        <div
                            className={`grid gap-4 ${results.length > 1 ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1"}`}
                        >
                            {results.map((result, idx) => (
                                <ResultCard
                                    key={`${result.model}-${idx}`}
                                    result={result}
                                    modelInfo={getModelInfo(result.model)}
                                    onCopy={() =>
                                        handleCopy(result.content, idx)
                                    }
                                    isCopied={copied === idx}
                                    index={idx}
                                    total={results.length}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sub Components ─────────────────────────────────────────────────────────────

function CategoryTab({ label, active, count, onClick, color }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                active
                    ? "text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
            style={
                active
                    ? {
                          backgroundColor: `${color}20`,
                          color: color,
                          boxShadow: `0 4px 12px ${color}15`,
                      }
                    : {}
            }
        >
            {label}
            <span
                className={`text-[9px] font-bold px-1 py-0.5 rounded ${active ? "bg-white/10" : "bg-white/5 text-slate-600"}`}
            >
                {count}
            </span>
        </button>
    );
}

function ModelCard({
    model,
    selected,
    isCompare,
    isRunning,
    onClick,
    disabled,
}) {
    const cat = CATEGORY_CONFIG[model.category] || CATEGORY_CONFIG.general;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                selected
                    ? "bg-violet-500/10 border border-violet-500/30 shadow-lg shadow-violet-500/5"
                    : disabled
                      ? "opacity-40 cursor-not-allowed bg-white/[0.01] border border-transparent"
                      : "bg-white/[0.01] border border-transparent hover:bg-white/[0.04] hover:border-white/10"
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Selection Indicator */}
                <div
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected
                            ? "bg-violet-600 border-violet-500"
                            : "border-white/15 group-hover:border-white/30"
                    }`}
                >
                    {selected && <Check size={11} className="text-white" />}
                    {isRunning && (
                        <Loader2
                            size={11}
                            className="text-white animate-spin"
                        />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-white truncate">
                            {model.name}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-500 uppercase tracking-wider shrink-0">
                            {model.size}
                        </span>
                        {!model.available && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase tracking-wider shrink-0">
                                Not Installed
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">
                        {model.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                            style={{
                                backgroundColor: `${cat.color}15`,
                                color: cat.color,
                            }}
                        >
                            {cat.emoji} {cat.label}
                        </span>
                        {model.strengths?.slice(0, 2).map((s) => (
                            <span
                                key={s}
                                className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-600"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </button>
    );
}

function EmptyState({ isCompareMode }) {
    return (
        <div className="h-full flex items-center justify-center min-h-[500px]">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/10 flex items-center justify-center">
                    <Terminal size={32} className="text-violet-400/60" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                    Ready to Test
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    {isCompareMode
                        ? "Select up to 4 models, write a prompt, and compare their outputs side by side."
                        : "Select a model, write a prompt, and see how it responds. Use Ctrl+Enter to run quickly."}
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <CircleDot size={10} className="text-violet-500" />
                        Select model
                    </span>
                    <span className="text-slate-800">→</span>
                    <span className="flex items-center gap-1.5">
                        <Terminal size={10} className="text-blue-500" />
                        Write prompt
                    </span>
                    <span className="text-slate-800">→</span>
                    <span className="flex items-center gap-1.5">
                        <Play size={10} className="text-emerald-500" />
                        Run
                    </span>
                </div>
            </div>
        </div>
    );
}

function RunningState({ models, getModelInfo }) {
    const [phase, setPhase] = useState(0);
    const phases = [
        "Connecting to Ollama…",
        "Loading model into memory…",
        "Generating response…",
        "Processing tokens…",
    ];

    useEffect(() => {
        const timer = setInterval(
            () => setPhase((p) => (p + 1) % phases.length),
            3000,
        );
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-full flex items-center justify-center min-h-[500px]">
            <div className="text-center max-w-md">
                {/* Animated orb */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full bg-violet-600/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-violet-600/30 animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/40 to-blue-600/40 flex items-center justify-center backdrop-blur-sm">
                        <Loader2
                            size={28}
                            className="text-violet-300 animate-spin"
                        />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                    Processing{" "}
                    {models.length > 1 ? `${models.length} Models` : "Prompt"}
                </h3>
                <p className="text-sm text-violet-400 font-medium mb-4 animate-pulse">
                    {phases[phase]}
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                    {models.map((id) => {
                        const info = getModelInfo(id);
                        return (
                            <span
                                key={id}
                                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1.5"
                            >
                                <Loader2 size={9} className="animate-spin" />
                                {info?.name || id}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ResultCard({ result, modelInfo, onCopy, isCopied, index, total }) {
    const cat = modelInfo
        ? CATEGORY_CONFIG[modelInfo.category] || CATEGORY_CONFIG.general
        : CATEGORY_CONFIG.general;

    const isError = result.status === "error";

    return (
        <div
            className={`bg-white/[0.02] border rounded-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                isError
                    ? "border-red-500/20"
                    : "border-white/10 hover:border-white/15"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                        style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                        }}
                    >
                        {cat.emoji}
                    </div>
                    <div>
                        <span className="text-sm font-bold text-white">
                            {modelInfo?.name || result.model}
                        </span>
                        {modelInfo && (
                            <span className="text-[9px] font-bold ml-2 px-1.5 py-0.5 rounded bg-white/5 text-slate-500 uppercase">
                                {modelInfo.size}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Metrics */}
                    {result.duration > 0 && (
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            {(result.duration / 1000).toFixed(1)}s
                        </span>
                    )}
                    {result.tokensPerSecond && (
                        <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                            <Zap size={10} />
                            {result.tokensPerSecond} tok/s
                        </span>
                    )}
                    {result.totalTokens && (
                        <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
                            {result.totalTokens} tokens
                        </span>
                    )}

                    {/* Copy */}
                    {!isError && (
                        <button
                            onClick={onCopy}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {isCopied ? (
                                <Check size={13} className="text-emerald-400" />
                            ) : (
                                <Copy size={13} />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4 max-h-[600px] overflow-y-auto">
                {isError ? (
                    <div className="flex items-start gap-3 text-red-400">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold mb-1">Error</p>
                            <p className="text-xs text-red-400/80">
                                {result.error}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                        {result.content}
                    </div>
                )}
            </div>

            {/* Footer with ranking info for comparison */}
            {total > 1 && !isError && (
                <div className="px-5 py-2 border-t border-white/5 bg-white/[0.01] flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                        Response #{index + 1}
                    </span>
                    {result.duration && (
                        <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                index === 0
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-white/5 text-slate-600"
                            }`}
                        >
                            {index === 0
                                ? "Fastest"
                                : `+${((result.duration - 0) / 1000).toFixed(1)}s`}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
