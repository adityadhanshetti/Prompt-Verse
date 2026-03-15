import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTrendingPrompts } from "../lib/promptApi.js";
import { useUser } from "@clerk/clerk-react";
import {
    Flame,
    TrendingUp,
    Heart,
    GitFork,
    Copy,
    Bookmark,
    Clock,
    Tag,
    Cpu,
    Zap,
    Crown,
    Medal,
    Award,
    ChevronRight,
    ArrowUpRight,
    Sparkles,
    Calendar,
} from "lucide-react";

export const Route = createFileRoute("/trending")({
    component: TrendingPage,
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function trendingScore(p) {
    return (
        (p.likesCount ?? 0) * 3 +
        (p.forksCount ?? 0) * 5 +
        (p.copiesCount ?? 0) * 2 +
        (p.savesCount ?? 0) 
    );
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const TIME_RANGES = [
    { key: "today", label: "Today", icon: <Clock size={12} /> },
    { key: "week", label: "This Week", icon: <Calendar size={12} /> },
    { key: "month", label: "This Month", icon: <Calendar size={12} /> },
    { key: "all", label: "All Time", icon: <Flame size={12} /> },
];

const CATEGORIES = [
    { value: "", label: "All", emoji: "🌐" },
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

const RANK_CONFIG = [
    {
        bg: "from-amber-500/20 to-yellow-500/10",
        border: "border-amber-500/30",
        badge: "bg-amber-500",
        icon: Crown,
        label: "#1",
        glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
    },
    {
        bg: "from-slate-300/15 to-slate-400/5",
        border: "border-slate-400/25",
        badge: "bg-slate-400",
        icon: Medal,
        label: "#2",
        glow: "shadow-[0_0_30px_rgba(148,163,184,0.1)]",
    },
    {
        bg: "from-orange-600/15 to-orange-500/5",
        border: "border-orange-600/25",
        badge: "bg-orange-600",
        icon: Award,
        label: "#3",
        glow: "shadow-[0_0_30px_rgba(234,88,12,0.1)]",
    },
];

// ─── Top 3 Spotlight Card ──────────────────────────────────────────────────────
function SpotlightCard({ prompt, rank, navigate }) {
    const config = RANK_CONFIG[rank];
    const score = trendingScore(prompt);
    const RankIcon = config.icon;

    return (
        <div
            className={`group relative flex flex-col rounded-3xl border ${config.border} bg-gradient-to-br ${config.bg} p-6 transition-all duration-500 hover:-translate-y-2 ${config.glow} hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]`}
        >
            {/* Rank badge */}
            <div
                className={`absolute -top-3 -left-3 size-10 ${config.badge} rounded-xl flex items-center justify-center shadow-lg`}
            >
                <RankIcon size={18} className="text-white" />
            </div>

            {/* Score badge */}
            <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white flex items-center gap-1">
                <Flame size={10} className="text-orange-400" />
                {score} pts
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mb-4 mt-2">
                <div className="size-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {(prompt.createdByMongoDBObjectId?.username ??
                        "?")[0].toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-400 truncate">
                    @{prompt.createdByMongoDBObjectId?.username ?? "unknown"}
                </span>
                {prompt.isTemplate && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 ml-auto">
                        <Zap size={8} fill="currentColor" /> Template
                    </span>
                )}
            </div>

            {/* Title */}
            <Link
                to="/prompt/$id"
                params={{ id: prompt._id }}
                className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug"
            >
                {prompt.title}
            </Link>

            {/* Tags */}
            {prompt.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {prompt.tags.slice(0, 3).map((t) => (
                        <span
                            key={t}
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-500 flex items-center gap-0.5"
                        >
                            <Tag size={7} />
                            {t}
                        </span>
                    ))}
                </div>
            )}

            {/* Category + models */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[10px] font-bold bg-blue-500/10 px-2 py-0.5 rounded text-blue-400 uppercase tracking-widest">
                    {prompt.category}
                </span>
                {prompt.modelSupport?.slice(0, 2).map((m) => (
                    <span
                        key={m}
                        className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest flex items-center gap-0.5"
                    >
                        <Cpu size={7} />
                        {m}
                    </span>
                ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-slate-500 mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-1">
                    <Heart size={12} />
                    <span className="text-xs font-medium">
                        {prompt.likesCount ?? 0}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <GitFork size={12} />
                    <span className="text-xs font-medium">
                        {prompt.forksCount ?? 0}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Copy size={12} />
                    <span className="text-xs font-medium">
                        {prompt.copiesCount ?? 0}
                    </span>
                </div>
                <div className="flex items-center gap-1 ml-auto text-[10px] text-slate-600">
                    <Clock size={9} />
                    {timeAgo(prompt.createdAt)}
                </div>
            </div>
        </div>
    );
}

// ─── Ranked Row Card ───────────────────────────────────────────────────────────
function RankedRow({ prompt, rank }) {
    const score = trendingScore(prompt);

    return (
        <Link
            to="/prompt/$id"
            params={{ id: prompt._id }}
            className="group flex items-center gap-4 md:gap-6 bg-[#0A0A0A] border border-white/5 hover:border-blue-500/25 rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
        >
            {/* Rank */}
            <div
                className={`text-2xl font-black w-10 text-center shrink-0 ${
                    rank <= 3
                        ? "text-amber-400"
                        : rank <= 10
                          ? "text-slate-400"
                          : "text-slate-600"
                }`}
            >
                {rank}
            </div>

            {/* Trending delta bar */}
            <div className="hidden md:block w-16 shrink-0">
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                        style={{ width: `${Math.min(100, score * 2)}%` }}
                    />
                </div>
                <span className="text-[9px] text-slate-600 mt-0.5 block">
                    {score} pts
                </span>
            </div>

            {/* Author avatar */}
            <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10">
                {(prompt.createdByMongoDBObjectId?.username ??
                    "?")[0].toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {prompt.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-600">
                        @
                        {prompt.createdByMongoDBObjectId?.username ?? "unknown"}
                    </span>
                    <span className="text-[10px] font-bold bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-400 uppercase tracking-widest">
                        {prompt.category}
                    </span>
                    {prompt.isTemplate && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 flex items-center gap-0.5">
                            <Zap size={7} fill="currentColor" /> Tmpl
                        </span>
                    )}
                    {prompt.tags?.slice(0, 2).map((t) => (
                        <span
                            key={t}
                            className="hidden lg:inline text-[9px] text-slate-600"
                        >
                            #{t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-slate-500 shrink-0">
                <div className="flex items-center gap-1 text-xs">
                    <Heart size={12} />
                    {prompt.likesCount ?? 0}
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <GitFork size={12} />
                    {prompt.forksCount ?? 0}
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <Copy size={12} />
                    {prompt.copiesCount ?? 0}
                </div>
            </div>

            <ArrowUpRight
                size={16}
                className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0"
            />
        </Link>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function TrendingPage() {
    const [range, setRange] = useState("week");
    const [category, setCategory] = useState("");
    const navigate = useNavigate();
    const { isSignedIn } = useUser();

    const { data: prompts = [], isLoading } = useQuery({
        queryKey: ["trendingPrompts", range, category],
        queryFn: () =>
            fetchTrendingPrompts({ range, category: category || undefined }),
    });

    const top3 = prompts.slice(0, 3);
    const theRest = prompts.slice(3);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-orange-500/30">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[15%] left-[20%] w-[50%] h-[50%] bg-orange-600/8 blur-[140px] rounded-full" />
                <div className="absolute top-[40%] -right-[15%] w-[35%] h-[35%] bg-amber-500/6 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-red-600/5 blur-[100px] rounded-full" />
            </div>

            {/* ── Hero Section ── */}
            <section className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25">
                                    <Flame
                                        size={14}
                                        className="text-orange-400"
                                    />
                                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                                        Live Trending
                                    </span>
                                </div>
                                <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-3">
                                What's{" "}
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-amber-400 to-yellow-400">
                                    on Fire
                                </span>{" "}
                                right now
                            </h1>
                            <p className="text-lg text-slate-500 max-w-lg">
                                The most liked, forked, and copied prompts —
                                ranked by community engagement.
                            </p>
                        </div>

                        {/* Quick stat */}
                        {!isLoading && prompts.length > 0 && (
                            <div className="flex items-center gap-6 shrink-0">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white">
                                        {prompts.length}
                                    </div>
                                    <div className="text-[10px] text-slate-600 uppercase tracking-widest">
                                        Trending
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white">
                                        {prompts
                                            .reduce(
                                                (acc, p) =>
                                                    acc + trendingScore(p),
                                                0,
                                            )
                                            .toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-slate-600 uppercase tracking-widest">
                                        Total Score
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Time range tabs */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/3 border border-white/8">
                            {TIME_RANGES.map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setRange(key)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        range === key
                                            ? "bg-orange-500/15 text-orange-300 shadow-sm"
                                            : "text-slate-500 hover:text-slate-300 hover:bg-white/4"
                                    }`}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
                {/* ── Category Filter Chips ── */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wider mr-1">
                        Filter:
                    </span>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                category === cat.value
                                    ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                                    : "bg-white/3 border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300"
                            }`}
                        >
                            <span>{cat.emoji}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* ── Loading ── */}
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-64 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse"
                                />
                            ))}
                        </div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                ) : prompts.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="size-20 rounded-3xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-center mb-5">
                            <Flame size={32} className="text-orange-500/40" />
                        </div>
                        <p className="text-xl font-bold text-white mb-2">
                            Nothing trending yet
                        </p>
                        <p className="text-sm text-slate-500 max-w-md mb-6">
                            {range === "today"
                                ? "No prompts have gained traction today. Check back later or try a wider time range."
                                : "Try selecting a different time range or category."}
                        </p>
                        <div className="flex gap-3">
                            {range !== "all" && (
                                <button
                                    type="button"
                                    onClick={() => setRange("all")}
                                    className="text-xs px-4 py-2 rounded-full border border-orange-500/25 text-orange-400 hover:bg-orange-500/10 transition-all"
                                >
                                    View All Time
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate({ to: "/explore" })}
                                className="text-xs px-4 py-2 rounded-full border border-white/10 text-slate-400 hover:border-blue-500/30 hover:text-blue-300 transition-all"
                            >
                                Explore Prompts
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Top 3 Spotlight ── */}
                        {top3.length > 0 && (
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-5">
                                    <Sparkles
                                        size={16}
                                        className="text-amber-400"
                                    />
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        Top Performers
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {top3.map((p, i) => (
                                        <SpotlightCard
                                            key={p._id}
                                            prompt={p}
                                            rank={i}
                                            navigate={navigate}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Full Ranked List ── */}
                        {theRest.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <TrendingUp
                                        size={16}
                                        className="text-slate-500"
                                    />
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        Full Rankings
                                    </h2>
                                    <span className="text-[10px] text-slate-600 ml-auto">
                                        {prompts.length} prompts ranked
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {theRest.map((p, i) => (
                                        <RankedRow
                                            key={p._id}
                                            prompt={p}
                                            rank={i + 4}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Scoring Legend ── */}
                        <div className="mt-12 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Flame size={12} className="text-orange-500" />{" "}
                                How Trending Score Works
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="size-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                        <Heart
                                            size={14}
                                            className="text-pink-400"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">
                                            Likes
                                        </div>
                                        <div className="text-[10px] text-slate-600">
                                            ×3 points
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <GitFork
                                            size={14}
                                            className="text-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">
                                            Forks
                                        </div>
                                        <div className="text-[10px] text-slate-600">
                                            ×5 points
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Copy
                                            size={14}
                                            className="text-emerald-400"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">
                                            Copies
                                        </div>
                                        <div className="text-[10px] text-slate-600">
                                            ×2 points
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Bookmark
                                            size={14}
                                            className="text-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">
                                            Saves
                                        </div>
                                        <div className="text-[10px] text-slate-600">
                                            ×1 point
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
