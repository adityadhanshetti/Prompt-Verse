import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
    SignedIn,
    SignedOut,
    RedirectToSignIn,
    useAuth,
} from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import {
    Plus,
    Sparkles,
    Eye,
    Info,
    X,
    ChevronRight,
    Globe,
    Lock,
    Hash,
    ChevronDown,
    Check,
    Filter,
    Cpu,
} from "lucide-react";
import { createPrompt, optimizePromptText } from "../lib/promptApi.js";

export const Route = createFileRoute("/create")({
    component: CreatePromptPage,
});

// ─── Shared Option Sets (same as explore) ──────────────────────────────────────
const DEFAULT_CATEGORIES = [
    { value: "general", label: "General", emoji: "🌐" },
    { value: "coding", label: "Software Dev", emoji: "💻" },
    { value: "marketing", label: "Marketing", emoji: "📣" },
    { value: "image", label: "Generative Art", emoji: "🎨" },
    { value: "writing", label: "Writing", emoji: "✍️" },
    { value: "research", label: "Research", emoji: "🔬" },
    { value: "productivity", label: "Productivity", emoji: "⚡" },
    { value: "business", label: "Business", emoji: "💼" },
    { value: "education", label: "Education", emoji: "📚" },
];

const DEFAULT_MODELS = [
    { value: "gpt-4", label: "GPT-4o", badge: "OpenAI" },
    { value: "gpt-3.5", label: "GPT-3.5", badge: "OpenAI" },
    { value: "claude", label: "Claude 3.5", badge: "Anthropic" },
    { value: "gemini", label: "Gemini 1.5", badge: "Google" },
    { value: "midjourney", label: "Midjourney v6", badge: "Image" },
    { value: "llama", label: "Llama 3", badge: "Meta" },
    { value: "mistral", label: "Mistral", badge: "Mistral AI" },
    { value: "stable-diffusion", label: "Stable Diffusion", badge: "Image" },
    { value: "dall-e", label: "DALL-E 3", badge: "OpenAI" },
];

// ─── Custom Dropdown (identical pattern to explore page) ───────────────────────
function CustomDropdown({
    icon: Icon,
    label: fieldLabel,
    placeholder,
    value,
    onChange,
    options: initialOptions,
    allowCustom,
    customLabel,
}) {
    const [open, setOpen] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [customInput, setCustomInput] = useState("");
    const [localOptions, setLocalOptions] = useState(initialOptions);
    const ref = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setCustomMode(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (customMode && inputRef.current) inputRef.current.focus();
    }, [customMode]);

    const selected = localOptions.find((o) => o.value === value);
    const displayLabel = selected ? selected.label : value || placeholder;

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setCustomMode(false);
    };
    const handleClear = (e) => {
        e.stopPropagation();
        onChange("");
    };

    const handleAddCustom = () => {
        const trimmed = customInput.trim();
        if (!trimmed) return;
        const newOpt = {
            value: trimmed.toLowerCase().replace(/\s+/g, "-"),
            label: trimmed,
            custom: true,
        };
        setLocalOptions((prev) => [...prev, newOpt]);
        onChange(newOpt.value);
        setCustomInput("");
        setCustomMode(false);
        setOpen(false);
    };

    return (
        <div className="space-y-2">
            {fieldLabel && (
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Icon size={10} />
                    {fieldLabel}
                </label>
            )}
            <div ref={ref} className="relative">
                {/* Trigger */}
                <button
                    type="button"
                    onClick={() => {
                        setOpen((o) => !o);
                        setCustomMode(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
                        ${
                            open
                                ? "bg-white/7 border-blue-500/60 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/7 hover:border-white/20"
                        }`}
                >
                    <span
                        className={`flex-1 text-left truncate text-sm ${value ? "text-white" : "text-slate-500"}`}
                    >
                        {selected?.emoji && (
                            <span className="mr-1.5">{selected.emoji}</span>
                        )}
                        {displayLabel}
                    </span>
                    {value ? (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleClear(e)
                            }
                            className="shrink-0 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={12} />
                        </span>
                    ) : (
                        <ChevronDown
                            size={13}
                            className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-blue-400" : "text-slate-600"}`}
                        />
                    )}
                </button>

                {/* Panel */}
                {open && (
                    <div className="absolute top-full mt-2 left-0 w-full min-w-55 z-50 rounded-2xl border border-white/10 bg-[#0e0e10]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                        <div className="p-1.5 max-h-64 overflow-y-auto">
                            {localOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                        value === opt.value
                                            ? "bg-blue-500/15 text-blue-300"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    {opt.emoji ? (
                                        <span className="text-base shrink-0">
                                            {opt.emoji}
                                        </span>
                                    ) : (
                                        <span className="size-5 flex items-center justify-center rounded-md bg-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                            {(opt.badge ?? opt.label).slice(
                                                0,
                                                2,
                                            )}
                                        </span>
                                    )}
                                    <span className="font-medium flex-1 text-left">
                                        {opt.label}
                                    </span>
                                    {opt.badge && (
                                        <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase shrink-0">
                                            {opt.badge}
                                        </span>
                                    )}
                                    {opt.custom && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase tracking-wider shrink-0">
                                            Custom
                                        </span>
                                    )}
                                    {value === opt.value && (
                                        <Check
                                            size={13}
                                            className="ml-auto text-blue-400 shrink-0"
                                        />
                                    )}
                                </button>
                            ))}

                            {allowCustom && (
                                <>
                                    <div className="my-1 h-px bg-white/[0.06]" />
                                    {customMode ? (
                                        <div className="flex items-center gap-2 px-2 py-1.5">
                                            <input
                                                ref={inputRef}
                                                value={customInput}
                                                onChange={(e) =>
                                                    setCustomInput(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        handleAddCustom();
                                                    if (e.key === "Escape") {
                                                        setCustomMode(false);
                                                        setCustomInput("");
                                                    }
                                                }}
                                                placeholder={`Custom ${customLabel}…`}
                                                className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCustom}
                                                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
                                            >
                                                <Check size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCustomMode(false);
                                                    setCustomInput("");
                                                }}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 transition-colors shrink-0"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setCustomMode(true)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/6 transition-colors"
                                        >
                                            <Plus size={13} />
                                            <span className="font-medium">
                                                Add custom {customLabel}
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Multi-Select Dropdown (for Model Support — multiple models) ───────────────
function MultiSelectDropdown({
    icon: Icon,
    label: fieldLabel,
    placeholder,
    selected: selectedValues,
    onChange,
    options: initialOptions,
    allowCustom,
    customLabel,
}) {
    const [open, setOpen] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [customInput, setCustomInput] = useState("");
    const [localOptions, setLocalOptions] = useState(initialOptions);
    const ref = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setCustomMode(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (customMode && inputRef.current) inputRef.current.focus();
    }, [customMode]);

    const toggleValue = (val) => {
        if (selectedValues.includes(val)) {
            onChange(selectedValues.filter((v) => v !== val));
        } else {
            onChange([...selectedValues, val]);
        }
    };

    const handleAddCustom = () => {
        const trimmed = customInput.trim();
        if (!trimmed) return;
        const val = trimmed.toLowerCase().replace(/\s+/g, "-");
        if (!localOptions.find((o) => o.value === val)) {
            setLocalOptions((prev) => [
                ...prev,
                { value: val, label: trimmed, custom: true },
            ]);
        }
        if (!selectedValues.includes(val)) {
            onChange([...selectedValues, val]);
        }
        setCustomInput("");
        setCustomMode(false);
    };

    const removeChip = (val) =>
        onChange(selectedValues.filter((v) => v !== val));

    const getLabel = (val) => {
        const opt = localOptions.find((o) => o.value === val);
        return opt ? opt.label : val;
    };

    return (
        <div className="space-y-2">
            {fieldLabel && (
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Icon size={10} />
                    {fieldLabel}
                </label>
            )}
            <div ref={ref} className="relative">
                {/* Trigger */}
                <button
                    type="button"
                    onClick={() => {
                        setOpen((o) => !o);
                        setCustomMode(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
                        ${
                            open
                                ? "bg-white/7 border-blue-500/60 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/7 hover:border-white/20"
                        }`}
                >
                    <span
                        className={`flex-1 text-left truncate text-sm ${selectedValues.length ? "text-white" : "text-slate-500"}`}
                    >
                        {selectedValues.length
                            ? `${selectedValues.length} model${selectedValues.length > 1 ? "s" : ""} selected`
                            : placeholder}
                    </span>
                    <ChevronDown
                        size={13}
                        className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-blue-400" : "text-slate-600"}`}
                    />
                </button>

                {/* Selected chips */}
                {selectedValues.length > 0 && !open && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedValues.map((val) => (
                            <span
                                key={val}
                                className="group flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300"
                            >
                                {getLabel(val)}
                                <button
                                    type="button"
                                    onClick={() => removeChip(val)}
                                    className="text-blue-400/60 hover:text-red-400 transition-colors"
                                >
                                    <X size={9} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Panel */}
                {open && (
                    <div className="absolute top-full mt-2 left-0 w-full min-w-55 z-50 rounded-2xl border border-white/10 bg-[#0e0e10]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                        <div className="p-1.5 max-h-64 overflow-y-auto">
                            {localOptions.map((opt) => {
                                const isSelected = selectedValues.includes(
                                    opt.value,
                                );
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => toggleValue(opt.value)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                            isSelected
                                                ? "bg-blue-500/15 text-blue-300"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        }`}
                                    >
                                        <span
                                            className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected
                                                    ? "bg-blue-500 border-blue-400"
                                                    : "border-white/20 bg-transparent"
                                            }`}
                                        >
                                            {isSelected && (
                                                <Check
                                                    size={10}
                                                    className="text-white"
                                                />
                                            )}
                                        </span>
                                        <span className="font-medium flex-1 text-left">
                                            {opt.label}
                                        </span>
                                        {opt.badge && (
                                            <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase shrink-0">
                                                {opt.badge}
                                            </span>
                                        )}
                                        {opt.custom && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase tracking-wider shrink-0">
                                                Custom
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {allowCustom && (
                                <>
                                    <div className="my-1 h-px bg-white/[0.06]" />
                                    {customMode ? (
                                        <div className="flex items-center gap-2 px-2 py-1.5">
                                            <input
                                                ref={inputRef}
                                                value={customInput}
                                                onChange={(e) =>
                                                    setCustomInput(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        handleAddCustom();
                                                    if (e.key === "Escape") {
                                                        setCustomMode(false);
                                                        setCustomInput("");
                                                    }
                                                }}
                                                placeholder={`Custom ${customLabel}…`}
                                                className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCustom}
                                                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
                                            >
                                                <Check size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCustomMode(false);
                                                    setCustomInput("");
                                                }}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 transition-colors shrink-0"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setCustomMode(true)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/6 transition-colors"
                                        >
                                            <Plus size={13} />
                                            <span className="font-medium">
                                                Add custom {customLabel}
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function CreatePromptPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-200">
            <SignedIn>
                <CreatePromptForm />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function CreatePromptForm() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    // Form States
    const [title, setTitle] = useState("");
    const [promptText, setPromptText] = useState("");
    const [tags, setTags] = useState("");
    const [category, setCategory] = useState("general");
    const [modelSupport, setModelSupport] = useState([]); // now an array!
    const [visibility, setVisibility] = useState("public");
    const [isTemplate, setIsTemplate] = useState(false);
    const [variables, setVariables] = useState([]);

    // --- Template Logic ---
    const validateTemplate = () => {
        const regex = /{{(.*?)}}/g;
        const matches = [...promptText.matchAll(regex)].map((m) => m[1].trim());
        const uniqueMatches = [...new Set(matches)];
        const definedKeys = variables.map((v) => v.key.trim()).filter(Boolean);
        const missingInVariables = uniqueMatches.filter(
            (key) => !definedKeys.includes(key),
        );
        const unusedInPrompt = definedKeys.filter(
            (key) => !uniqueMatches.includes(key),
        );
        return {
            isValid: missingInVariables.length === 0,
            missingInVariables,
            unusedInPrompt,
        };
    };

    const syncVariablesFromText = () => {
        const regex = /{{(.*?)}}/g;
        const matches = [...promptText.matchAll(regex)].map((m) => m[1].trim());
        const uniqueMatches = [...new Set(matches)];
        const currentKeys = variables.map((v) => v.key);
        const newKeys = uniqueMatches.filter(
            (key) => !currentKeys.includes(key),
        );
        const newVars = newKeys.map((key) => ({
            key,
            description: "",
            defaultValue: "",
            required: false,
        }));
        setVariables([...variables, ...newVars]);
    };

    const handlePublish = () => {
        if (isTemplate) {
            const { isValid, missingInVariables } = validateTemplate();
            if (!isValid) {
                alert(
                    `Missing variable definitions for: ${missingInVariables.join(", ")}`,
                );
                return;
            }
        }
        mutation.mutate();
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const payload = {
                title,
                promptText,
                tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                category,
                modelSupport, // already an array
                visibility,
                isTemplate,
                variables: isTemplate ? variables : [],
            };
            console.log(payload, "Payload");
            return createPrompt(payload, token);
        },
        onSuccess: (prompt) => {
            navigate({ to: `/prompt/${prompt._id}` });
        },
    });

    const optimizeMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const payload = {
                title,
                promptText,
                tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                category,
                modelSupport,
                isTemplate,
                variables: isTemplate ? variables : [],
            };
            return optimizePromptText(payload, token);
        },
        onSuccess: (data) => {
            if (data?.optimizedPrompt) {
                setPromptText(data.optimizedPrompt);
                setPipelineInfo(data.pipeline);
            }
        },
        onError: (error) => {
            alert("Failed to optimize prompt: " + error.message);
        },
    });

    // ─── Pipeline UI State ────────────────────────────────────────────────
    const [pipelineInfo, setPipelineInfo] = useState(null);
    const [optimizePhase, setOptimizePhase] = useState(0);

    const OPTIMIZE_PHASES = [
        "NEURAL OPTIMIZATION…",
        "DEEP REASONING…",
        "SYNTHESIZING…",
        "QUALITY VERIFICATION…",
        "REFINING OUTPUT…",
        "ALMOST THERE…",
    ];

    // Rotate loading messages during optimization
    useEffect(() => {
        if (optimizeMutation.status !== "pending") {
            setOptimizePhase(0);
            return;
        }
        const timer = setInterval(() => {
            setOptimizePhase((prev) => (prev + 1) % OPTIMIZE_PHASES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [optimizeMutation.status]);

    const handleOptimizePrompt = () => {
        if (!promptText.trim()) return;
        setPipelineInfo(null);
        optimizeMutation.mutate();
    };

    const addVariable = () => {
        setVariables([
            ...variables,
            { key: "", description: "", defaultValue: "", required: false },
        ]);
    };

    const updateVariable = (index, field, value) => {
        const newVars = [...variables];
        newVars[index][field] = value;
        setVariables(newVars);
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10">
            {/* Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-widest mb-2">
                        <Sparkles size={16} /> New Artifact
                    </div>
                    <h1 className="text-4xl font-extrabold text-white">
                        Forge a Prompt
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Design, tokenize, and share your AI instructions.
                    </p>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={mutation.isLoading}
                    className="bg-white text-black hover:bg-blue-400 px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                    {mutation.isLoading ? "Deploying..." : "Publish Prompt"}
                    <ChevronRight size={18} />
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* LEFT: FORM */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Primary Content Section */}
                    <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-6">
                        <div className="space-y-2 flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase px-1">
                                Title
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Name your creation..."
                                className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-xl focus:border-blue-500/50 focus:ring-0 transition-all text-md font-sm text-white"
                            />
                        </div>

                        {/* <div className="space-y-2 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">
                                    Prompt {"(Instruction Set)"}
                                </label>
                                <button
                                    type="button"
                                    onClick={handleOptimizePrompt}
                                    disabled={
                                        optimizeMutation.status === "pending" ||
                                        !promptText.trim()
                                    }
                                    className="text-[10px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50 cursor-pointer border border-blue-500/20"
                                >
                                    <Sparkles size={12} />
                                    {optimizeMutation.status === "pending"
                                        ? "Optimizing..."
                                        : "AI Optimize"}
                                </button>
                            </div>
                            <textarea
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder="Write your prompt here"
                                rows={16}
                                className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-xl focus:border-blue-500/50 focus:ring-0 transition-all font-mono text-sm leading-relaxed"
                            />
                        </div> */}
                        <div className="space-y-2 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    Neural Instruction Set
                                </label>
                                <div className="flex items-center gap-2">
                                    {/* Pipeline score badge (shown after optimization) */}
                                    {pipelineInfo &&
                                        optimizeMutation.status !==
                                            "pending" && (
                                            <div
                                                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all animate-in fade-in slide-in-from-right-2 ${
                                                    pipelineInfo.passed
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                }`}
                                            >
                                                <span>
                                                    {pipelineInfo.passed
                                                        ? "✓"
                                                        : "⚠"}
                                                </span>
                                                <span>
                                                    Score{" "}
                                                    {pipelineInfo.finalScore}/10
                                                </span>
                                                <span className="text-slate-600">
                                                    ·
                                                </span>
                                                <span>
                                                    {pipelineInfo.totalAttempts}{" "}
                                                    attempt
                                                    {pipelineInfo.totalAttempts >
                                                    1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                            </div>
                                        )}
                                    <button
                                        type="button"
                                        onClick={handleOptimizePrompt}
                                        disabled={
                                            optimizeMutation.status ===
                                                "pending" || !promptText.trim()
                                        }
                                        className="text-[10px] font-black flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all disabled:opacity-30 border border-blue-500/30 relative overflow-hidden active:scale-95"
                                    >
                                        <Sparkles
                                            size={14}
                                            className={
                                                optimizeMutation.status ===
                                                "pending"
                                                    ? "animate-pulse"
                                                    : ""
                                            }
                                        />
                                        <span className="relative z-10">
                                            {optimizeMutation.status ===
                                            "pending"
                                                ? OPTIMIZE_PHASES[optimizePhase]
                                                : "AI OPTIMIZE"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-[#050507] shadow-2xl">
                                {/* BIG WAVY GRAIN EFFECT */}
                                {optimizeMutation.status === "pending" && (
                                    <>
                                        <style
                                            dangerouslySetInnerHTML={{
                                                __html: `
                    @keyframes big-vibration {
                        0% { transform: translate(0,0) scale(1); }
                        25% { transform: translate(-1%, 0.5%) scale(1.01); }
                        50% { transform: translate(1%, -0.5%) scale(1); }
                        75% { transform: translate(-0.5%, -1%) scale(1.01); }
                        100% { transform: translate(0,0) scale(1); }
                    }
                    @keyframes scanline-roll {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(100%); }
                    }
                    .ai-noise {
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                    }
                    .wavy-distort {
                        filter: url(#wavy-filter);
                    }
                `,
                                            }}
                                        />

                                        {/* SVG Filter for the actual "Wave" distortion */}
                                        <svg className="hidden">
                                            <filter id="wavy-filter">
                                                <feTurbulence
                                                    type="fractalNoise"
                                                    baseFrequency="0.02"
                                                    numOctaves="3"
                                                    seed="2"
                                                >
                                                    <animate
                                                        attributeName="baseFrequency"
                                                        dur="0.5s"
                                                        values="0.02;0.05;0.02"
                                                        repeatCount="indefinite"
                                                    />
                                                </feTurbulence>
                                                <feDisplacementMap
                                                    in="SourceGraphic"
                                                    scale="20"
                                                />
                                            </filter>
                                        </svg>

                                        {/* 1. The Shaking Grain Layer */}
                                        <div className="absolute inset-[-10%] z-20 pointer-events-none ai-noise opacity-[0.12] mix-blend-screen animate-[big-vibration_0.15s_steps(2)_infinite]" />

                                        {/* 2. The Big Rolling Scanline */}
                                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                                            <div className="w-full h-1/2 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-[scanline-roll_2s_linear_infinite] blur-2xl" />
                                        </div>

                                        {/* 3. Deep Blue Glow Overlay */}
                                        <div className="absolute inset-0 z-10 pointer-events-none bg-blue-950/20 backdrop-blur-[1px]" />
                                    </>
                                )}

                                <textarea
                                    value={promptText}
                                    onChange={(e) =>
                                        setPromptText(e.target.value)
                                    }
                                    placeholder="Input raw instructions..."
                                    rows={16}
                                    disabled={
                                        optimizeMutation.status === "pending"
                                    }
                                    className={`w-full bg-transparent px-8 py-7 transition-all font-mono text-sm leading-relaxed outline-none focus:ring-0 resize-none
                ${
                    optimizeMutation.status === "pending"
                        ? "text-blue-300/30 selection:bg-transparent wavy-distort cursor-wait"
                        : "text-slate-300 focus:text-white"
                }`}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Template Logic */}
                    <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`size-10 rounded-lg flex items-center justify-center transition-colors ${isTemplate ? "bg-purple-500 text-white" : "bg-white/5 text-slate-500"}`}
                                >
                                    <Hash size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">
                                        Dynamic Variables
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Enable placeholder logic using{" "}
                                        {"{{key}}"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTemplate(!isTemplate)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${isTemplate ? "bg-purple-500/20 text-purple-400 border border-purple-500/40" : "bg-white/5 text-slate-400 border border-white/10"}`}
                            >
                                {isTemplate ? "Enabled" : "Enable"}
                            </button>
                        </div>

                        {isTemplate && (
                            <div className="space-y-4 mt-6 animate-in fade-in slide-in-from-top-2">
                                {/* Validation messages */}
                                {promptText &&
                                    validateTemplate().missingInVariables
                                        .length > 0 && (
                                        <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-4 py-3 rounded-xl text-xs">
                                            <Info size={14} />
                                            <span>
                                                Missing definitions for
                                                variables found in text.
                                            </span>
                                            <button
                                                onClick={syncVariablesFromText}
                                                className="ml-auto underline font-bold cursor-pointer"
                                            >
                                                Sync Now
                                            </button>
                                        </div>
                                    )}

                                {variables.map((v, index) => (
                                    <div
                                        key={index}
                                        className="group relative bg-white/[0.03] border border-white/10 p-5 rounded-2xl transition-all hover:border-purple-500/30"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVariables(
                                                    variables.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-4 space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">
                                                    Variable Key
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-mono text-xs">
                                                        {"{{"}
                                                    </span>
                                                    <input
                                                        placeholder="product_name"
                                                        value={v.key}
                                                        onChange={(e) =>
                                                            updateVariable(
                                                                index,
                                                                "key",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-8 py-2.5 text-sm focus:border-purple-500/50 transition-all font-mono"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 font-mono text-xs">
                                                        {"}}"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-3 space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">
                                                    Default
                                                </label>
                                                <input
                                                    placeholder="Optional..."
                                                    value={v.defaultValue}
                                                    onChange={(e) =>
                                                        updateVariable(
                                                            index,
                                                            "defaultValue",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500/50 transition-all"
                                                />
                                            </div>
                                            <div className="md:col-span-5 space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">
                                                    Tooltip / Description
                                                </label>
                                                <input
                                                    placeholder="What should the user enter?"
                                                    value={v.description}
                                                    onChange={(e) =>
                                                        updateVariable(
                                                            index,
                                                            "description",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <button
                                        type="button"
                                        onClick={addVariable}
                                        className="py-3 border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                    >
                                        <Plus size={14} /> Add Manual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={syncVariablesFromText}
                                        className="py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
                                    >
                                        <Sparkles size={14} /> Sync from Text
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* RIGHT: METADATA & PREVIEW */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-10 space-y-6">
                        {/* Meta Settings */}
                        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} /> Metadata & Visibility
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Category dropdown */}
                                <CustomDropdown
                                    icon={Filter}
                                    label="Category"
                                    placeholder="Select category"
                                    value={category}
                                    onChange={setCategory}
                                    options={DEFAULT_CATEGORIES}
                                    allowCustom
                                    customLabel="category"
                                />

                                {/* Visibility toggle */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                        {visibility === "public" ? (
                                            <Globe size={10} />
                                        ) : (
                                            <Lock size={10} />
                                        )}
                                        Visibility
                                    </label>
                                    <div className="flex rounded-xl overflow-hidden border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVisibility("public")
                                            }
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold transition-all ${
                                                visibility === "public"
                                                    ? "bg-emerald-500/15 text-emerald-400 border-r border-emerald-500/20"
                                                    : "bg-white/3 text-slate-500 hover:bg-white/5 border-r border-white/10"
                                            }`}
                                        >
                                            <Globe size={12} /> Public
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVisibility("private")
                                            }
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold transition-all ${
                                                visibility === "private"
                                                    ? "bg-orange-500/15 text-orange-400"
                                                    : "bg-white/3 text-slate-500 hover:bg-white/5"
                                            }`}
                                        >
                                            <Lock size={12} /> Private
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tags (kept as text input since they're free-form) */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1 flex items-center gap-2">
                                    <Hash size={10} /> Tags{" "}
                                    {"(comma separated)"}
                                </label>
                                <input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="ai, productivity, image generation..."
                                    className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>

                            {/* Model Support — multi-select dropdown */}
                            <MultiSelectDropdown
                                icon={Cpu}
                                label="Model Support"
                                placeholder="Select models..."
                                selected={modelSupport}
                                onChange={setModelSupport}
                                options={DEFAULT_MODELS}
                                allowCustom
                                customLabel="model"
                            />
                        </div>

                        {/* Live Preview Card */}
                        <div className="bg-blue-600/5 border border-blue-500/20 rounded-[2rem] p-8 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                    Live Prompt Preview
                                </h3>
                                <div className="opacity-20">
                                    <Eye size={20} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white">
                                    {title || "Untitled Prompt"}
                                </h2>
                                <div className="bg-black/40 rounded-xl p-4 border border-white/5 min-h-[100px] text-sm text-slate-400 whitespace-pre-wrap font-mono italic leading-relaxed line-clamp-4 overflow-hidden">
                                    {promptText ||
                                        "The instructions will manifest here..."}
                                </div>

                                {/* Preview badges */}
                                <div className="flex flex-wrap gap-2">
                                    {category && (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 uppercase tracking-widest">
                                            {category}
                                        </span>
                                    )}
                                    {modelSupport.map((m) => (
                                        <span
                                            key={m}
                                            className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-slate-400 uppercase tracking-widest flex items-center gap-1"
                                        >
                                            <Cpu size={8} />
                                            {m}
                                        </span>
                                    ))}
                                </div>

                                {isTemplate && variables.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {variables.map(
                                            (v, i) =>
                                                v.key && (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-md"
                                                    >
                                                        {`{{${v.key}}}`}
                                                    </span>
                                                ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
