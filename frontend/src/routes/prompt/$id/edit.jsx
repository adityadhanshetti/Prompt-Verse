import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";

import {
    useAuth,
    useUser,
    SignedIn,
    SignedOut,
    RedirectToSignIn,
} from "@clerk/clerk-react";

import {
    ArrowLeft,
    Pencil,
    Sparkles,
    ChevronRight,
    Hash,
    X,
    Plus,
    Info,
    Check,
    ChevronDown,
    Globe,
    Lock,
    Eye,
    Cpu,
    Filter,
    Shield,
    FileText,
    Tag,
    MessageSquare,
} from "lucide-react";

import { fetchPromptById, updatePrompt, optimizePromptText } from "../../../lib/promptApi.js";

export const Route = createFileRoute("/prompt/$id/edit")({
    component: EditPromptPage,
});

// ─── Shared Option Sets ───────────────────────────────────────────
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

const VISIBILITY_OPTIONS = [
    { value: "public", label: "Public", icon: Globe, desc: "Anyone can see" },
    { value: "unlisted", label: "Unlisted", icon: Eye, desc: "Only with link" },
    { value: "private", label: "Private", icon: Lock, desc: "Only you" },
];

// ─── Custom Dropdown ───────────────────────────────────────────────
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
                <button
                    type="button"
                    onClick={() => {
                        setOpen((o) => !o);
                        setCustomMode(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 outline-none cursor-pointer
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
                            onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
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

                {open && (
                    <div className="absolute top-full mt-2 left-0 w-full min-w-55 z-50 rounded-2xl border border-white/10 bg-[#0e0e10]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                        <div className="p-1.5 max-h-64 overflow-y-auto">
                            {localOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                                        value === opt.value
                                            ? "bg-blue-500/15 text-blue-300"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    {opt.emoji ? (
                                        <span className="text-base shrink-0">{opt.emoji}</span>
                                    ) : (
                                        <span className="size-5 flex items-center justify-center rounded-md bg-white/5 text-[9px] font-bold text-slate-500 uppercase shrink-0">
                                            {(opt.badge ?? opt.label).slice(0, 2)}
                                        </span>
                                    )}
                                    <span className="font-medium flex-1 text-left">{opt.label}</span>
                                    {opt.badge && (
                                        <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase shrink-0">
                                            {opt.badge}
                                        </span>
                                    )}
                                    {value === opt.value && (
                                        <Check size={13} className="ml-auto text-blue-400 shrink-0" />
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
                                                onChange={(e) => setCustomInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAddCustom();
                                                    if (e.key === "Escape") {
                                                        setCustomMode(false);
                                                        setCustomInput("");
                                                    }
                                                }}
                                                placeholder={`Custom ${customLabel}…`}
                                                className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                            />
                                            <button type="button" onClick={handleAddCustom} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0 cursor-pointer">
                                                <Check size={13} />
                                            </button>
                                            <button type="button" onClick={() => { setCustomMode(false); setCustomInput(""); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 transition-colors shrink-0 cursor-pointer">
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setCustomMode(true)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/6 transition-colors cursor-pointer"
                                        >
                                            <Plus size={13} />
                                            <span className="font-medium">Add custom {customLabel}</span>
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

// ─── Multi-Select Dropdown ────────────────────────────────────────
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
            setLocalOptions((prev) => [...prev, { value: val, label: trimmed, custom: true }]);
        }
        if (!selectedValues.includes(val)) onChange([...selectedValues, val]);
        setCustomInput("");
        setCustomMode(false);
    };

    const removeChip = (val) => onChange(selectedValues.filter((v) => v !== val));
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
                <button
                    type="button"
                    onClick={() => { setOpen((o) => !o); setCustomMode(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 outline-none cursor-pointer
                        ${open
                            ? "bg-white/7 border-blue-500/60 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/7 hover:border-white/20"
                        }`}
                >
                    <span className={`flex-1 text-left truncate text-sm ${selectedValues.length ? "text-white" : "text-slate-500"}`}>
                        {selectedValues.length ? `${selectedValues.length} model${selectedValues.length > 1 ? "s" : ""} selected` : placeholder}
                    </span>
                    <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-blue-400" : "text-slate-600"}`} />
                </button>

                {selectedValues.length > 0 && !open && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedValues.map((val) => (
                            <span key={val} className="group flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300">
                                {getLabel(val)}
                                <button type="button" onClick={() => removeChip(val)} className="text-blue-400/60 hover:text-red-400 transition-colors cursor-pointer">
                                    <X size={9} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {open && (
                    <div className="absolute top-full mt-2 left-0 w-full min-w-55 z-50 rounded-2xl border border-white/10 bg-[#0e0e10]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                        <div className="p-1.5 max-h-64 overflow-y-auto">
                            {localOptions.map((opt) => {
                                const isSelected = selectedValues.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => toggleValue(opt.value)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${isSelected ? "bg-blue-500/15 text-blue-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                                    >
                                        <span className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-blue-500 border-blue-400" : "border-white/20 bg-transparent"}`}>
                                            {isSelected && <Check size={10} className="text-white" />}
                                        </span>
                                        <span className="font-medium flex-1 text-left">{opt.label}</span>
                                        {opt.badge && <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase shrink-0">{opt.badge}</span>}
                                    </button>
                                );
                            })}
                            {allowCustom && (
                                <>
                                    <div className="my-1 h-px bg-white/[0.06]" />
                                    {customMode ? (
                                        <div className="flex items-center gap-2 px-2 py-1.5">
                                            <input ref={inputRef} value={customInput} onChange={(e) => setCustomInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); if (e.key === "Escape") { setCustomMode(false); setCustomInput(""); } }} placeholder={`Custom ${customLabel}…`} className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors" />
                                            <button type="button" onClick={handleAddCustom} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0 cursor-pointer"><Check size={13} /></button>
                                            <button type="button" onClick={() => { setCustomMode(false); setCustomInput(""); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 transition-colors shrink-0 cursor-pointer"><X size={13} /></button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => setCustomMode(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/6 transition-colors cursor-pointer">
                                            <Plus size={13} />
                                            <span className="font-medium">Add custom {customLabel}</span>
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

// ─── Main Page ────────────────────────────────────────────────────
function EditPromptPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-200">
            <SignedIn>
                <EditPromptForm />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function EditPromptForm() {
    const { id } = Route.useParams();
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const queryClient = useQueryClient();

    const {
        data: prompt,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["prompt", id],
        queryFn: () => fetchPromptById(id),
    });

    // Form state
    const [title, setTitle] = useState("");
    const [promptText, setPromptText] = useState("");
    const [tags, setTags] = useState("");
    const [category, setCategory] = useState("general");
    const [modelSupport, setModelSupport] = useState([]);
    const [visibility, setVisibility] = useState("public");
    const [changeNote, setChangeNote] = useState("");
    const [isTemplate, setIsTemplate] = useState(false);
    const [variables, setVariables] = useState([]);

    // Track original values for diff indicators
    const [original, setOriginal] = useState(null);

    useEffect(() => {
        if (prompt) {
            setTitle(prompt.title);
            setPromptText(prompt.promptText);
            setTags(prompt.tags?.join(", ") || "");
            setCategory(prompt.category || "general");
            setModelSupport(prompt.modelSupport || []);
            setVisibility(prompt.visibility || "public");
            setIsTemplate(!!prompt.isTemplate);
            setVariables(prompt.variables || []);
            setOriginal({
                title: prompt.title,
                promptText: prompt.promptText,
                tags: prompt.tags?.join(", ") || "",
                category: prompt.category || "general",
                visibility: prompt.visibility || "public",
            });
        }
    }, [prompt]);

    // Template logic
    const syncVariablesFromText = () => {
        const regex = /{{(.*?)}}/g;
        const matches = [...promptText.matchAll(regex)].map((m) => m[1].trim());
        const uniqueMatches = [...new Set(matches)];
        const currentKeys = variables.map((v) => v.key);
        const newKeys = uniqueMatches.filter((key) => !currentKeys.includes(key));
        const newVars = newKeys.map((key) => ({
            key,
            description: "",
            defaultValue: "",
            required: false,
        }));
        setVariables([...variables, ...newVars]);
    };

    const validateTemplate = () => {
        const regex = /{{(.*?)}}/g;
        const matches = [...promptText.matchAll(regex)].map((m) => m[1].trim());
        const uniqueMatches = [...new Set(matches)];
        const definedKeys = variables.map((v) => v.key.trim()).filter(Boolean);
        const missingInVariables = uniqueMatches.filter((key) => !definedKeys.includes(key));
        return { isValid: missingInVariables.length === 0, missingInVariables };
    };

    const updateVariable = (index, field, value) => {
        const newVars = [...variables];
        newVars[index][field] = value;
        setVariables(newVars);
    };

    // AI Optimize
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

    const optimizeMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return optimizePromptText(
                {
                    title,
                    promptText,
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    category,
                    modelSupport,
                    isTemplate,
                    variables: isTemplate ? variables : [],
                },
                token,
            );
        },
        onSuccess: (data) => {
            if (data?.optimizedPrompt) {
                setPromptText(data.optimizedPrompt);
                setPipelineInfo(data.pipeline);
            }
        },
    });

    useEffect(() => {
        if (optimizeMutation.status !== "pending") { setOptimizePhase(0); return; }
        const timer = setInterval(() => {
            setOptimizePhase((prev) => (prev + 1) % OPTIMIZE_PHASES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [optimizeMutation.status]);

    // Save mutation
    const mutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("Token missing. Please login again.");
            return updatePrompt(
                id,
                {
                    title,
                    promptText,
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    category,
                    modelSupport,
                    visibility,
                    changeNote,
                    isTemplate,
                    variables: isTemplate ? variables : [],
                },
                token,
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["prompt", id]);
            queryClient.invalidateQueries(["prompts"]);
            queryClient.invalidateQueries(["versions", id]);
            window.location.href = `/prompt/${id}`;
        },
    });

    const handlePublish = () => {
        if (isTemplate) {
            const { isValid, missingInVariables } = validateTemplate();
            if (!isValid) {
                alert(`Missing variable definitions for: ${missingInVariables.join(", ")}`);
                return;
            }
        }
        mutation.mutate();
    };

    // Change tracking
    const hasChanges =
        original &&
        (title !== original.title ||
            promptText !== original.promptText ||
            tags !== original.tags ||
            category !== original.category ||
            visibility !== original.visibility);

    const changedFields = original
        ? [
              title !== original.title && "title",
              promptText !== original.promptText && "content",
              tags !== original.tags && "tags",
              category !== original.category && "category",
              visibility !== original.visibility && "visibility",
          ].filter(Boolean)
        : [];

    // Loading / Error / Access states
    if (!isLoaded || isLoading) {
        return (
            <div className="max-w-[1400px] mx-auto px-6 py-20 animate-pulse space-y-10">
                <div className="h-10 w-1/3 bg-white/5 rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-7 space-y-6">
                        <div className="h-[500px] bg-white/[0.02] border border-white/5 rounded-[2rem]" />
                    </div>
                    <div className="lg:col-span-5 h-96 bg-white/[0.02] border border-white/5 rounded-[2rem]" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <div className="size-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Prompt Not Found</h2>
                    <p className="text-slate-500 mb-8">This prompt might have been deleted or moved.</p>
                    <Link to="/" className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    if (!user || prompt.authorId?.clerkId !== user.id) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <div className="size-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-8">You don't have permission to edit this prompt.</p>
                    <Link to={`/prompt/${id}`} className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold">
                        View Prompt
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10">
            {/* Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Link
                        to="/prompt/$id"
                        params={{ id }}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Prompt
                    </Link>
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-widest mb-2">
                        <Pencil size={16} /> Edit Artifact
                    </div>
                    <h1 className="text-4xl font-extrabold text-white">Refine Your Prompt</h1>
                    <p className="text-slate-500 mt-2">
                        Changes will be saved as a new version automatically.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Change indicator */}
                    {hasChanges && (
                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-semibold">
                            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                            {changedFields.length} unsaved change{changedFields.length > 1 ? "s" : ""}
                        </div>
                    )}
                    <button
                        onClick={handlePublish}
                        disabled={mutation.isPending || !hasChanges}
                        className="bg-white text-black hover:bg-blue-400 px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {mutation.isPending ? "Saving..." : "Save Changes"}
                        <ChevronRight size={18} />
                    </button>
                </div>
            </header>

            {mutation.isError && (
                <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                    <X size={16} />
                    Error: {mutation.error?.message || "Failed to save"}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* LEFT: FORM */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Primary Content */}
                    <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-6">
                        {/* Title */}
                        <div className="space-y-2 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">Title</label>
                                {original && title !== original.title && (
                                    <span className="text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">Modified</span>
                                )}
                            </div>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Name your creation..."
                                className="w-full bg-white/3 border border-white/10 px-5 py-4 rounded-xl focus:border-blue-500/50 focus:ring-0 transition-all text-md text-white outline-none"
                            />
                        </div>

                        {/* Prompt Text */}
                        <div className="space-y-2 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    Neural Instruction Set
                                </label>
                                <div className="flex items-center gap-2">
                                    {pipelineInfo && optimizeMutation.status !== "pending" && (
                                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                            pipelineInfo.passed
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        }`}>
                                            <span>{pipelineInfo.passed ? "✓" : "⚠"}</span>
                                            <span>Score {pipelineInfo.finalScore}/10</span>
                                            <span className="text-slate-600">·</span>
                                            <span>{pipelineInfo.totalAttempts} attempt{pipelineInfo.totalAttempts > 1 ? "s" : ""}</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!promptText.trim()) return;
                                            setPipelineInfo(null);
                                            optimizeMutation.mutate();
                                        }}
                                        disabled={optimizeMutation.status === "pending" || !promptText.trim()}
                                        className="text-[10px] font-black flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all disabled:opacity-30 border border-blue-500/30 relative overflow-hidden active:scale-95 cursor-pointer"
                                    >
                                        <Sparkles size={14} className={optimizeMutation.status === "pending" ? "animate-pulse" : ""} />
                                        <span className="relative z-10">
                                            {optimizeMutation.status === "pending" ? OPTIMIZE_PHASES[optimizePhase] : "AI OPTIMIZE"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-[#050507] shadow-2xl">
                                {optimizeMutation.status === "pending" && (
                                    <>
                                        <style dangerouslySetInnerHTML={{ __html: `
                                            @keyframes big-vibration { 0% { transform: translate(0,0) scale(1); } 25% { transform: translate(-1%, 0.5%) scale(1.01); } 50% { transform: translate(1%, -0.5%) scale(1); } 75% { transform: translate(-0.5%, -1%) scale(1.01); } 100% { transform: translate(0,0) scale(1); } }
                                            @keyframes scanline-roll { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                                            .ai-noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
                                        ` }} />
                                        <div className="absolute inset-[-10%] z-20 pointer-events-none ai-noise opacity-[0.12] mix-blend-screen animate-[big-vibration_0.15s_steps(2)_infinite]" />
                                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                                            <div className="w-full h-1/2 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-[scanline-roll_2s_linear_infinite] blur-2xl" />
                                        </div>
                                        <div className="absolute inset-0 z-10 pointer-events-none bg-blue-950/20 backdrop-blur-[1px]" />
                                    </>
                                )}
                                <textarea
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    placeholder="Input raw instructions..."
                                    rows={16}
                                    disabled={optimizeMutation.status === "pending"}
                                    className={`w-full bg-transparent px-8 py-7 transition-all font-mono text-sm leading-relaxed outline-none focus:ring-0 resize-none ${
                                        optimizeMutation.status === "pending"
                                            ? "text-blue-300/30 selection:bg-transparent cursor-wait"
                                            : "text-slate-300 focus:text-white"
                                    }`}
                                />
                            </div>

                            {/* Content change indicator */}
                            {original && promptText !== original.promptText && (
                                <div className="flex items-center gap-2 text-[11px] text-amber-400/60 px-1">
                                    <FileText size={11} />
                                    Content modified ({promptText.length - original.promptText.length > 0 ? "+" : ""}{promptText.length - original.promptText.length} chars)
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Template Variables */}
                    <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${isTemplate ? "bg-purple-500 text-white" : "bg-white/5 text-slate-500"}`}>
                                    <Hash size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Dynamic Variables</h3>
                                    <p className="text-xs text-slate-500">Enable placeholder logic using {"{{key}}"}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTemplate(!isTemplate)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${isTemplate ? "bg-purple-500/20 text-purple-400 border border-purple-500/40" : "bg-white/5 text-slate-400 border border-white/10"}`}
                            >
                                {isTemplate ? "Enabled" : "Enable"}
                            </button>
                        </div>

                        {isTemplate && (
                            <div className="space-y-4 mt-6">
                                {promptText && validateTemplate().missingInVariables.length > 0 && (
                                    <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-4 py-3 rounded-xl text-xs">
                                        <Info size={14} />
                                        <span>Missing definitions for variables found in text.</span>
                                        <button onClick={syncVariablesFromText} className="ml-auto underline font-bold cursor-pointer">
                                            Sync Now
                                        </button>
                                    </div>
                                )}

                                {variables.map((v, index) => (
                                    <div key={index} className="group relative bg-white/3 border border-white/10 p-5 rounded-2xl transition-all hover:border-purple-500/30">
                                        <button
                                            type="button"
                                            onClick={() => setVariables(variables.filter((_, i) => i !== index))}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-4 space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Variable Key</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-mono text-xs">{"{{"}</span>
                                                    <input placeholder="product_name" value={v.key} onChange={(e) => updateVariable(index, "key", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-8 py-2.5 text-sm focus:border-purple-500/50 transition-all font-mono outline-none" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 font-mono text-xs">{"}}"}</span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-4 space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Description</label>
                                                <input placeholder="What this variable is for" value={v.description} onChange={(e) => updateVariable(index, "description", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500/50 transition-all outline-none" />
                                            </div>
                                            <div className="md:col-span-4 space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Default Value</label>
                                                <input placeholder="Optional default" value={v.defaultValue} onChange={(e) => updateVariable(index, "defaultValue", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500/50 transition-all outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setVariables([...variables, { key: "", description: "", defaultValue: "", required: false }])}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/5 transition-all cursor-pointer"
                                >
                                    <Plus size={14} /> Add Variable
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* RIGHT: SIDEBAR */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-28 space-y-6">
                        {/* Metadata Card */}
                        <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                                Prompt Metadata
                            </h3>

                            {/* Category Dropdown */}
                            <CustomDropdown
                                icon={Filter}
                                label="Category"
                                placeholder="Select a category"
                                value={category}
                                onChange={setCategory}
                                options={DEFAULT_CATEGORIES}
                                allowCustom
                                customLabel="category"
                            />

                            {/* Model Support */}
                            <MultiSelectDropdown
                                icon={Cpu}
                                label="Model Support"
                                placeholder="Any model"
                                selected={modelSupport}
                                onChange={setModelSupport}
                                options={DEFAULT_MODELS}
                                allowCustom
                                customLabel="model"
                            />

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Tag size={10} /> Tags
                                </label>
                                <input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="system, chatgpt, image"
                                    className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500/50 transition-all outline-none text-white placeholder:text-slate-600"
                                />
                                <p className="text-[10px] text-slate-600 px-1">Separate with commas</p>
                            </div>

                            {/* Visibility */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Globe size={10} /> Visibility
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {VISIBILITY_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setVisibility(opt.value)}
                                                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                                    visibility === opt.value
                                                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                                        : "bg-white/3 border-white/8 text-slate-500 hover:bg-white/5 hover:text-white"
                                                }`}
                                            >
                                                <Icon size={14} />
                                                <span>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Change Note */}
                        <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <MessageSquare size={11} /> Change Note
                            </h3>
                            <input
                                value={changeNote}
                                onChange={(e) => setChangeNote(e.target.value)}
                                placeholder="e.g. Improved structure, fixed grammar..."
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 transition-all outline-none text-white placeholder:text-slate-600"
                            />
                            <p className="text-[10px] text-slate-600 px-1">
                                Optional — describe what you changed for the version history
                            </p>
                        </section>

                        {/* Changes Summary */}
                        {changedFields.length > 0 && (
                            <section className="bg-amber-500/5 border border-amber-500/15 rounded-[2rem] p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                        Pending Changes
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {changedFields.map((field) => (
                                        <span key={field} className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
