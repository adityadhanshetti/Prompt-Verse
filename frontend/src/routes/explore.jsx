import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPromptsAdvanced, toggleLikePrompt, toggleSavePrompt } from "../lib/promptApi.js";
import { useUser, useAuth } from "@clerk/clerk-react";
import {
    Search,
    Filter,
    Zap,
    Heart,
    Bookmark,
    GitFork,
    ChevronDown,
    Flame,
    TrendingUp,
    X,
    Plus,
    Check,
    Cpu,
    SlidersHorizontal,
    Copy,
    Tag,
    Clock,
    Brain,
} from "lucide-react";

export const Route = createFileRoute("/explore")({
    component: ExplorePage,
});

// ─── Static Option Sets ────────────────────────────────────────────────────────
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function CustomDropdown({
    icon: Icon,
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
        <div ref={ref} className="relative min-w-45">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => {
                    setOpen((o) => !o);
                    setCustomMode(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
                    ${
                        open
                            ? "bg-white/7 border-blue-500/60 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                            : "bg-white/3 border-white/10 text-slate-300 hover:bg-white/6 hover:border-white/20"
                    }`}
            >
                <Icon
                    size={14}
                    className={open ? "text-blue-400" : "text-slate-500"}
                />
                <span
                    className={`flex-1 text-left truncate ${value ? "text-white" : "text-slate-500"}`}
                >
                    {selected?.emoji && (
                        <span className="mr-1">{selected.emoji}</span>
                    )}
                    {displayLabel}
                </span>
                {value ? (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={handleClear}
                        onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
                        className="ml-auto shrink-0 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={12} />
                    </span>
                ) : (
                    <ChevronDown
                        size={13}
                        className={`ml-auto shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-blue-400" : "text-slate-600"}`}
                    />
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="absolute top-full mt-2 left-0 w-full min-w-55 z-50 rounded-2xl border border-white/10 bg-[#0e0e10]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="p-1.5 max-h-72 overflow-y-auto">
                        {/* All option */}
                        <button
                            type="button"
                            onClick={() =>
                                handleSelect({ value: "", label: placeholder })
                            }
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                !value
                                    ? "bg-blue-500/15 text-blue-300"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <span className="text-base">🌐</span>
                            <span className="font-medium">{placeholder}</span>
                            {!value && (
                                <Check
                                    size={13}
                                    className="ml-auto text-blue-400"
                                />
                            )}
                        </button>

                        <div className="my-1 h-px bg-white/6" />

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
                                        {(opt.badge ?? opt.label).slice(0, 2)}
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
                                <div className="my-1 h-px bg-white/6" />
                                {customMode ? (
                                    <div className="flex items-center gap-2 px-2 py-1.5">
                                        <input
                                            ref={inputRef}
                                            value={customInput}
                                            onChange={(e) =>
                                                setCustomInput(e.target.value)
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
    );
}

// ─── Dynamic Search Bar ────────────────────────────────────────────────────────
const SUGGESTIONS = [
    "Write a cold email",
    "Debug Python code",
    "Generate image prompt",
    "SEO meta description",
    "Explain like I'm 5",
    "Twitter viral post",
];

function DynamicSearchBar({ value, onChange }) {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef(null);

    const handleSuggestion = (s) => {
        onChange(s);
        inputRef.current?.focus();
    };
    const clearSearch = () => {
        onChange("");
        inputRef.current?.focus();
    };

    return (
        <div className="relative grow group">
            {/* Glow ring */}
            <div
                className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none
                ${focused ? "shadow-[0_0_0_3px_rgba(59,130,246,0.2),0_0_30px_rgba(59,130,246,0.08)]" : ""}`}
            />

            <div
                className={`relative flex items-center rounded-2xl border transition-all duration-300
                ${
                    focused
                        ? "bg-white/5 border-blue-500/50"
                        : "bg-white/3 border-white/10 hover:border-white/15 hover:bg-white/4"
                }`}
            >
                <Search
                    className={`absolute left-4 h-5 w-5 shrink-0 transition-colors duration-200 ${focused ? "text-blue-400" : "text-slate-500"}`}
                />
                <input
                    ref={inputRef}
                    id="explore-search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Search by title, tags, category, model…"
                    className="w-full bg-transparent pl-12 pr-12 py-4 text-base text-white placeholder:text-slate-600 outline-none"
                    autoComplete="off"
                />
                {value && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Suggestion pills shown when empty & unfocused */}
            {!value && !focused && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wider">
                        Try:
                    </span>
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={() => handleSuggestion(s)}
                            className="text-xs px-3 py-1 rounded-full bg-white/4 border border-white/8 text-slate-500 hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/6 transition-all"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Live char count */}
            {focused && value.length > 0 && (
                <div className="absolute -bottom-6 right-0 text-[11px] text-slate-600">
                    {value.length} characters
                </div>
            )}
        </div>
    );
}

// ─── Active Filter Chips ───────────────────────────────────────────────────────
function ActiveFilters({ search, category, model, tag, isTemplate, onClear }) {
    const chips = [];
    if (search) chips.push({ label: `"${search}"`, key: "search" });
    if (category) chips.push({ label: category, key: "category" });
    if (model) chips.push({ label: model, key: "model" });
    if (tag) chips.push({ label: `#${tag}`, key: "tag" });
    if (isTemplate) chips.push({ label: "Templates only", key: "template" });
    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal size={10} /> Active:
            </span>
            {chips.map((c) => (
                <button
                    key={c.key}
                    type="button"
                    onClick={() => onClear(c.key)}
                    className="group flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-300 transition-all"
                >
                    <span className="truncate max-w-30">{c.label}</span>
                    <X
                        size={10}
                        className="shrink-0 opacity-60 group-hover:opacity-100"
                    />
                </button>
            ))}
            <button
                type="button"
                onClick={() => onClear("all")}
                className="text-[11px] text-slate-600 hover:text-slate-400 underline underline-offset-2 transition-colors ml-1"
            >
                Clear all
            </button>
        </div>
    );
}

// ─── Prompt Card ───────────────────────────────────────────────────────────────
function PromptCard({ p, onTagClick }) {
    const { getToken, isSignedIn } = useAuth();
    const queryClient = useQueryClient();

    const [liked, setLiked] = useState(!!p.isLiked);
    const [saved, setSaved] = useState(!!p.isSaved);
    const [likesCount, setLikesCount] = useState(p.likesCount ?? 0);
    const [savesCount, setSavesCount] = useState(p.savesCount ?? 0);

    const likeMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleLikePrompt(p._id, token);
        },
        onMutate: () => {
            setLiked((prev) => !prev);
            setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
        },
        onSuccess: (data) => {
            setLiked(data.liked);
            setLikesCount(data.likesCount);
        },
        onError: () => {
            setLiked((prev) => !prev);
            setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["explorePrompts"] });
        },
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleSavePrompt(p._id, token);
        },
        onMutate: () => {
            setSaved((prev) => !prev);
            setSavesCount((prev) => (saved ? prev - 1 : prev + 1));
        },
        onSuccess: (data) => {
            setSaved(data.saved);
            setSavesCount(data.savesCount);
        },
        onError: () => {
            setSaved((prev) => !prev);
            setSavesCount((prev) => (saved ? prev + 1 : prev - 1));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["explorePrompts"] });
            queryClient.invalidateQueries({ queryKey: ["savedPrompts"] });
        },
    });

    return (
        <div className="group relative flex flex-col bg-[#0A0A0A] border border-white/5 hover:border-blue-500/30 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),0_0_20px_rgba(59,130,246,0.1)]">
            {/* Top row: author + badges */}
            <div className="flex items-start justify-between mb-4 gap-2">
                <Link
                    to="/user/$id"
                    params={{ id: p.authorId?.clerkId }}
                    className="flex items-center gap-2 min-w-0 group/author"
                >
                    <div className="size-7 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {(p.authorId?.username ?? "?")[0].toUpperCase()}
                    </div>
                    <span className="text-[12px] font-semibold text-slate-500 truncate group-hover/author:text-blue-400 transition-colors">
                        @{p.authorId?.username ?? "unknown"}
                    </span>
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                    {p.isTemplate && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400">
                            <Zap size={9} fill="currentColor" /> Template
                        </span>
                    )}
                </div>
            </div>

            {/* Title */}
            <Link
                to="/prompt/$id"
                params={{ id: p._id }}
                className="text-[17px] font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug"
            >
                {p.title}
            </Link>

            {/* Description */}
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 grow leading-relaxed">
                A prompt for{" "}
                <span className="text-slate-400">{p.category}</span> tasks
                {p.modelSupport?.length > 0 && (
                    <>
                        {" "}
                        using{" "}
                        <span className="text-slate-400">
                            {p.modelSupport.join(", ")}
                        </span>
                    </>
                )}
                .
            </p>

            {/* Tags row */}
            {p.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.tags.slice(0, 5).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => onTagClick(t)}
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-500 hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/6 transition-all"
                        >
                            <Tag size={8} />
                            {t}
                        </button>
                    ))}
                    {p.tags.length > 5 && (
                        <span className="text-[10px] text-slate-600 self-center">
                            +{p.tags.length - 5}
                        </span>
                    )}
                </div>
            )}

            {/* Model badges */}
            {p.modelSupport?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.modelSupport.slice(0, 4).map((m) => (
                        <span
                            key={m}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-widest"
                        >
                            <Cpu size={8} />
                            {m}
                        </span>
                    ))}
                </div>
            )}

            {/* Category badge */}
            <div className="mb-4">
                <span className="text-[10px] font-bold bg-blue-500/10 px-2 py-1 rounded text-blue-400 uppercase tracking-widest">
                    {p.category}
                </span>
            </div>

            {/* Footer — Interactive Like/Save */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                        type="button"
                        onClick={() => isSignedIn && likeMutation.mutate()}
                        disabled={likeMutation.isPending}
                        className={`flex items-center gap-1 transition-all duration-200 cursor-pointer ${liked ? "text-red-400" : "text-slate-500 hover:text-red-400"}`}
                        title={isSignedIn ? (liked ? "Unlike" : "Like") : "Sign in to like"}
                    >
                        <Heart size={13} fill={liked ? "currentColor" : "none"} className={`transition-transform ${liked ? "scale-110" : ""}`} />
                        <span className="text-xs font-medium">{likesCount}</span>
                    </button>

                    {/* Forks — static */}
                    <div className="flex items-center gap-1 text-slate-500">
                        <GitFork size={13} />
                        <span className="text-xs font-medium">{p.forksCount ?? 0}</span>
                    </div>

                    {/* Copies — static */}
                    <div className="flex items-center gap-1 text-slate-500">
                        <Copy size={13} />
                        <span className="text-xs font-medium">{p.copiesCount ?? 0}</span>
                    </div>

                    {/* Save Button */}
                    <button
                        type="button"
                        onClick={() => isSignedIn && saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className={`flex items-center gap-1 transition-all duration-200 cursor-pointer ${saved ? "text-amber-400" : "text-slate-500 hover:text-amber-400"}`}
                        title={isSignedIn ? (saved ? "Unsave" : "Save") : "Sign in to save"}
                    >
                        <Bookmark size={13} fill={saved ? "currentColor" : "none"} className={`transition-transform ${saved ? "scale-110" : ""}`} />
                        <span className="text-xs font-medium">{savesCount}</span>
                    </button>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock size={10} />
                    {timeAgo(p.createdAt)}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const SORT_TABS = [
    {
        key: "new",
        label: "New",
        icon: <Clock size={11} className="text-slate-400" />,
    },
    {
        key: "trending",
        label: "Trending",
        icon: <Flame size={11} className="text-orange-400" />,
    },
    {
        key: "likes",
        label: "Top Liked",
        icon: <Heart size={11} className="text-pink-400" />,
    },
];

function ExplorePage() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [sort, setSort] = useState("new");
    const [model, setModel] = useState("");
    const [tag, setTag] = useState("");
    const [isTemplate, setIsTemplate] = useState(false);

    const navigate = useNavigate();
    const { isSignedIn } = useUser();

    const handleRedirection = () =>
        navigate({ to: isSignedIn ? "/create" : "/sign-in" });

    const clearFilter = useCallback((key) => {
        if (key === "all") {
            setSearch("");
            setCategory("");
            setModel("");
            setTag("");
            setIsTemplate(false);
            return;
        }
        if (key === "search") setSearch("");
        if (key === "category") setCategory("");
        if (key === "model") setModel("");
        if (key === "tag") setTag("");
        if (key === "template") setIsTemplate(false);
    }, []);

    const { data: prompts = [], isLoading } = useQuery({
        queryKey: [
            "explorePrompts",
            search,
            category,
            sort,
            model,
            tag,
            isTemplate,
        ],
        queryFn: () =>
            fetchPromptsAdvanced({
                search,
                category,
                sort,
                model,
                tag,
                isTemplate,
            }),
    });

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-blue-500/30">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Header strip */}
            <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-3">
                <div className="max-w-450 mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm border-r border-white/10 pr-6">
                            <TrendingUp
                                size={14}
                                className="text-emerald-400"
                            />
                            <span className="text-white font-medium">2.4k</span>
                            <span className="text-slate-500">New today</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Flame size={14} className="text-orange-500" />
                            <span className="text-white font-medium">
                                12.1k
                            </span>
                            <span className="text-slate-500">
                                Active Creators
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleRedirection}
                        className="text-xs font-bold uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full hover:bg-blue-400 transition-all cursor-pointer"
                    >
                        Submit Prompt
                    </button>
                </div>
            </header>

            <div className="relative z-10 max-w-450 mx-auto px-6 py-8">
                {/* ── Search & Filters ── */}
                <section className="mb-10">
                    <div className="flex flex-col gap-5">
                        {/* Heading */}
                        <div className="max-w-2xl">
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
                                Engine for{" "}
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">
                                    Creativity.
                                </span>
                            </h1>
                            <p className="text-lg text-slate-400">
                                Search millions of high-performance prompts — by
                                title, tags, category or model.
                            </p>
                        </div>

                        {/* Search + filters row */}
                        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
                            <div className="w-full xl:max-w-2xl">
                                <DynamicSearchBar
                                    value={search}
                                    onChange={setSearch}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 -mt-2">
                                <CustomDropdown
                                    icon={Filter}
                                    placeholder="All Categories"
                                    value={category}
                                    onChange={setCategory}
                                    options={DEFAULT_CATEGORIES}
                                    allowCustom
                                    customLabel="category"
                                />
                                <CustomDropdown
                                    icon={Cpu}
                                    placeholder="All Models"
                                    value={model}
                                    onChange={setModel}
                                    options={DEFAULT_MODELS}
                                    allowCustom
                                    customLabel="model"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsTemplate((t) => !t)}
                                    className={`flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold border transition-all ${
                                        isTemplate
                                            ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                            : "bg-white/3 border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/6"
                                    }`}
                                >
                                    <Zap
                                        size={14}
                                        fill={isTemplate ? "white" : "none"}
                                    />
                                    Templates
                                </button>
                            </div>
                        </div>

                        {/* Active tag pill (set by clicking a tag on a card) */}
                        {tag && (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-600 uppercase tracking-wider">
                                    Filtering by tag:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setTag("")}
                                    className="group flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-300 transition-all"
                                >
                                    <Tag size={9} />#{tag}
                                    <X
                                        size={10}
                                        className="opacity-60 group-hover:opacity-100"
                                    />
                                </button>
                            </div>
                        )}

                        {/* Active filter chips */}
                        <ActiveFilters
                            search={search}
                            category={category}
                            model={model}
                            tag={tag}
                            isTemplate={isTemplate}
                            onClear={clearFilter}
                        />
                    </div>
                </section>

                {/* ── Sort tabs + result count ── */}
                <div className="flex items-center justify-between mb-6 border-b border-white/6 pb-4">
                    <div className="flex gap-1">
                        {SORT_TABS.map(({ key, label, icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSort(key)}
                                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg transition-all ${
                                    sort === key
                                        ? "bg-white/7 text-white"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/4"
                                }`}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>
                    {!isLoading && (
                        <span className="text-xs text-slate-600 font-medium">
                            {prompts.length} result
                            {prompts.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {/* ── Results ── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="h-72 rounded-3xl bg-white/2 border border-white/5 animate-pulse"
                            />
                        ))}
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="size-16 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-center mb-4">
                            <Search size={24} className="text-slate-600" />
                        </div>
                        <p className="text-lg font-semibold text-white mb-1">
                            No prompts found
                        </p>
                        <p className="text-sm text-slate-500 mb-4">
                            Try different keywords or clear some filters.
                        </p>
                        <button
                            type="button"
                            onClick={() => clearFilter("all")}
                            className="text-xs px-4 py-2 rounded-full border border-white/10 text-slate-400 hover:border-blue-500/40 hover:text-blue-300 transition-all"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        {prompts.map((p) => (
                            <PromptCard key={p._id} p={p} onTagClick={setTag} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
