import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Search,
    Layers,
    Globe,
    Clock,
    Flame,
    TrendingUp,
    BookOpen,
    X,
    Plus,
    SlidersHorizontal,
    Bookmark,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCollectionsExplore, toggleSaveCollection } from "../../lib/collectionApi.js";

export const Route = createFileRoute("/collections/explore")({
    component: ExploreCollectionsPage,
});

// ─── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ─── Search Bar ──────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
    "Coding tools",
    "Writing prompts",
    "Marketing kit",
    "Research pack",
    "Productivity",
    "Image generation",
];

function SearchBar({ value, onChange }) {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef(null);

    return (
        <div className="relative grow group">
            {/* Glow ring */}
            <div
                className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none
                ${focused ? "shadow-[0_0_0_3px_rgba(139,92,246,0.2),0_0_30px_rgba(139,92,246,0.08)]" : ""}`}
            />

            <div
                className={`relative flex items-center rounded-2xl border transition-all duration-300
                ${
                    focused
                        ? "bg-white/5 border-violet-500/50"
                        : "bg-white/3 border-white/10 hover:border-white/15 hover:bg-white/4"
                }`}
            >
                <Search
                    className={`absolute left-4 h-5 w-5 shrink-0 transition-colors duration-200 ${focused ? "text-violet-400" : "text-slate-500"}`}
                />
                <input
                    ref={inputRef}
                    id="collections-explore-search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Search collections by title or description…"
                    className="w-full bg-transparent pl-12 pr-12 py-4 text-base text-white placeholder:text-slate-600 outline-none"
                    autoComplete="off"
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange("");
                            inputRef.current?.focus();
                        }}
                        className="absolute right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Suggestion pills */}
            {!value && !focused && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wider">
                        Try:
                    </span>
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={() => onChange(s)}
                            className="text-xs px-3 py-1 rounded-full bg-white/4 border border-white/8 text-slate-500 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/6 transition-all"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Collection Card ─────────────────────────────────────────────────────────────
function CollectionCard({ c, currentUserId }) {
    const promptCount = c.prompts?.length ?? 0;
    const hue = ((c._id?.charCodeAt(0) ?? 0) * 37) % 360;
    const gradientStyle = {
        background: `linear-gradient(135deg, hsl(${hue},60%,25%) 0%, hsl(${(hue + 60) % 360},50%,18%) 100%)`,
    };

    const creator = c.creator;
    const displayName = creator?.username
        ? `@${creator.username}`
        : creator?.fullName ?? "unknown";
    const avatarLetter = (creator?.username?.[0] ?? creator?.fullName?.[0] ?? "?").toUpperCase();

    const isSaved = currentUserId ? c.savedBy?.includes(currentUserId) : false;

    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const saveMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleSaveCollection(c._id, token);
        },
        onMutate: async () => {
            // Optimistic update across all queries that might have this collection
            const queryKeys = queryClient.getQueriesData({ queryKey: ["exploreCollections"] });
            
            queryKeys.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                queryClient.setQueryData(queryKey, (old) => {
                    if (!old) return old;
                    return old.map((col) => {
                        if (col._id === c._id) {
                            const newSavedBy = isSaved
                                ? col.savedBy.filter((id) => id !== currentUserId)
                                : [...(col.savedBy || []), currentUserId];
                            
                            return {
                                ...col,
                                savedBy: newSavedBy,
                                savesCount: isSaved
                                    ? Math.max(0, (col.savesCount || 0) - 1)
                                    : (col.savesCount || 0) + 1,
                            };
                        }
                        return col;
                    });
                });
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["exploreCollections"] });
        },
    });

    const handleSaveClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId) {
            navigate({ to: "/sign-in" });
            return;
        }
        saveMutation.mutate();
    };

    return (
        <Link
            to="/collections/$id"
            params={{ id: c._id }}
            className="group relative flex flex-col bg-[#0A0A0A] border border-white/5 hover:border-violet-500/30 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),0_0_20px_rgba(139,92,246,0.1)]"
        >
            {/* Color Banner */}
            <div
                className="h-20 w-full shrink-0 relative overflow-hidden"
                style={gradientStyle}
            >
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Layers size={64} />
                </div>
                {/* Prompt count pill */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/10">
                    <BookOpen size={10} />
                    {promptCount} prompt{promptCount !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col p-5 flex-1">
                {/* Visibility badge */}
                <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                        <Globe size={9} /> Public
                    </span>
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Clock size={9} />
                        {timeAgo(c.createdAt)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-[17px] font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors leading-snug">
                    {c.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">
                    {c.description || "No description provided."}
                </p>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0" onClick={(e) => e.preventDefault()}>
                        {creator?.avatar ? (
                            <img
                                src={creator.avatar}
                                alt={displayName}
                                className="size-6 rounded-full shrink-0 object-cover"
                            />
                        ) : (
                            <div
                                className="size-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                                style={gradientStyle}
                            >
                                {avatarLetter}
                            </div>
                        )}
                        <Link
                            to="/user/$id"
                            params={{ id: creator?.clerkId ?? "" }}
                            className="text-[11px] text-slate-500 font-medium truncate hover:text-violet-400 transition-colors"
                        >
                            {displayName}
                        </Link>
                    </div>
                    
                    <button
                        onClick={handleSaveClick}
                        disabled={saveMutation.isPending}
                        className={`group/btn flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors z-10 ${
                            isSaved 
                                ? "text-violet-400 bg-violet-500/10 hover:bg-violet-500/20" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        }`}
                        title={isSaved ? "Unsave collection" : "Save collection"}
                    >
                        <Bookmark size={13} className={isSaved ? "fill-current" : ""} />
                        <span className="text-[11px] font-medium">
                            {c.savesCount ?? 0}
                        </span>
                    </button>
                </div>
            </div>
        </Link>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="flex flex-col bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden animate-pulse">
            <div className="h-20 bg-white/5" />
            <div className="p-5 flex flex-col gap-3">
                <div className="h-3 w-20 bg-white/5 rounded-full" />
                <div className="h-5 w-3/4 bg-white/6 rounded-lg" />
                <div className="h-3 w-full bg-white/4 rounded-full" />
                <div className="h-3 w-2/3 bg-white/4 rounded-full" />
                <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="h-3 w-24 bg-white/5 rounded-full" />
                    <div className="h-3 w-16 bg-white/5 rounded-full" />
                </div>
            </div>
        </div>
    );
}

// ─── Sort Tabs ────────────────────────────────────────────────────────────────────
const SORT_TABS = [
    { key: "new", label: "Newest", icon: <Clock size={11} className="text-slate-400" /> },
    { key: "popular", label: "Most Saved", icon: <Flame size={11} className="text-orange-400" /> },
    { key: "largest", label: "Largest", icon: <Layers size={11} className="text-violet-400" /> },
];

// ─── Main Page ────────────────────────────────────────────────────────────────────
function ExploreCollectionsPage() {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("new");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const navigate = useNavigate();
    const { isSignedIn, user } = useUser();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: collections = [], isLoading } = useQuery({
        queryKey: ["exploreCollections", debouncedSearch, sort],
        queryFn: () => fetchCollectionsExplore({ search: debouncedSearch, sort }),
    });

    const handleCreate = () =>
        navigate({ to: isSignedIn ? "/collections/create" : "/sign-in" });

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-violet-500/30">
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-600/8 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-600/8 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-fuchsia-600/6 blur-[120px] rounded-full" />
            </div>

            {/* Header strip */}
            <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-3">
                <div className="max-w-450 mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm border-r border-white/10 pr-6">
                            <TrendingUp size={14} className="text-violet-400" />
                            <span className="text-white font-medium">
                                {isLoading ? "—" : collections.length}
                            </span>
                            <span className="text-slate-500">Public Collections</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Layers size={14} className="text-fuchsia-400" />
                            <span className="text-white font-medium">
                                {isLoading
                                    ? "—"
                                    : collections.reduce(
                                          (acc, c) => acc + (c.prompts?.length ?? 0),
                                          0,
                                      )}
                            </span>
                            <span className="text-slate-500">Total Prompts</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full hover:bg-violet-400 transition-all cursor-pointer"
                    >
                        <Plus size={14} />
                        New Collection
                    </button>
                </div>
            </header>

            <div className="relative z-10 max-w-450 mx-auto px-6 py-8">
                {/* ── Hero & Search ── */}
                <section className="mb-10">
                    <div className="flex flex-col gap-5">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
                                Explore{" "}
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-fuchsia-400">
                                    Collections.
                                </span>
                            </h1>
                            <p className="text-lg text-slate-400">
                                Discover curated prompt packs crafted by the
                                community — find the perfect toolkit for your
                                workflow.
                            </p>
                        </div>

                        <div className="w-full max-w-2xl">
                            <SearchBar value={search} onChange={setSearch} />
                        </div>

                        {search && (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1">
                                    <SlidersHorizontal size={10} /> Active:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="group flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-300 transition-all"
                                >
                                    <span className="truncate max-w-30">
                                        &ldquo;{search}&rdquo;
                                    </span>
                                    <X
                                        size={10}
                                        className="shrink-0 opacity-60 group-hover:opacity-100"
                                    />
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Sort tabs + count ── */}
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
                            {collections.length} result
                            {collections.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {/* ── Results ── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : collections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="size-16 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-center mb-4">
                            <Search size={24} className="text-slate-600" />
                        </div>
                        <p className="text-lg font-semibold text-white mb-1">
                            No collections found
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            {search
                                ? "Try a different keyword."
                                : "Be the first to share a collection!"}
                        </p>
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="text-xs px-4 py-2 rounded-full border border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition-all"
                            >
                                Clear search
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="flex items-center gap-2 text-xs px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all"
                            >
                                <Plus size={13} />
                                Create a Collection
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {collections.map((c) => (
                            <CollectionCard key={c._id} c={c} currentUserId={user?.id} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
