import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    useAuth,
    useUser,
    SignedIn,
    SignedOut,
    RedirectToSignIn,
} from "@clerk/clerk-react";
import {
    Heart,
    MessageCircle,
    Image as ImageIcon,
    Send,
    Users,
    Globe,
    ChevronDown,
    X,
    Plus,
    Link2,
    Tag,
    Cpu,
    Zap,
    Sparkles,
    Clock,
    Trash2,
    Check,
    ArrowUpRight,
    Flame,
} from "lucide-react";
import {
    fetchAllPosts,
    fetchFollowingPosts,
    createPost,
    toggleLikePost,
} from "../lib/postApi.js";
import { fetchMyPromptsForLinking } from "../lib/postApi.js";

export const Route = createFileRoute("/feed")({
    component: FeedPage,
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
}

// ─── Prompt Linker Dropdown ────────────────────────────────────────────────────
function PromptLinker({ value, onChange, token }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const { data: myPromptsRaw, isLoading } = useQuery({
        queryKey: ["myPromptsForLinking"],
        queryFn: () => fetchMyPromptsForLinking(token),
        enabled: open && !!token,
    });

    const myPrompts = Array.isArray(myPromptsRaw) ? myPromptsRaw : [];

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = myPrompts.find((p) => p._id === value);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    value
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                        : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-400"
                }`}
            >
                <Link2 size={12} />
                {selected ? (
                    <span className="truncate max-w-[160px]">
                        {selected.title}
                    </span>
                ) : (
                    "Link a Prompt"
                )}
                {value && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && onChange(null)}
                        className="ml-1 text-purple-400/60 hover:text-red-400 transition-colors cursor-pointer"
                    >
                        <X size={10} />
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute bottom-full mb-2 left-0 w-72 z-50 rounded-2xl border border-white/10 bg-[#0e0e10]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="p-2 max-h-64 overflow-y-auto">
                        {isLoading ? (
                            <div className="text-xs text-slate-600 px-3 py-4 text-center">
                                Loading your prompts…
                            </div>
                        ) : myPrompts.length === 0 ? (
                            <div className="text-xs text-slate-600 px-3 py-4 text-center">
                                No prompts found. Create one first!
                            </div>
                        ) : (
                            myPrompts.map((p) => (
                                <button
                                    key={p._id}
                                    type="button"
                                    onClick={() => {
                                        onChange(p._id);
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                        value === p._id
                                            ? "bg-purple-500/15 text-purple-300"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="text-xs font-medium truncate">
                                            {p.title}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] bg-blue-500/10 px-1 py-0.5 rounded text-blue-400 uppercase tracking-wider">
                                                {p.category}
                                            </span>
                                            {p.modelSupport
                                                ?.slice(0, 2)
                                                .map((m) => (
                                                    <span
                                                        key={m}
                                                        className="text-[9px] text-slate-600"
                                                    >
                                                        {m}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                    {value === p._id && (
                                        <Check
                                            size={12}
                                            className="text-purple-400 shrink-0"
                                        />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Create Post Composer ──────────────────────────────────────────────────────
function PostComposer({ onSuccess }) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [caption, setCaption] = useState("");
    const [imageUrls, setImageUrls] = useState([""]);
    const [linkedPromptId, setLinkedPromptId] = useState(null);
    const [tags, setTags] = useState("");
    const [showImages, setShowImages] = useState(false);
    const [token, setToken] = useState(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        getToken().then(setToken);
    }, [getToken]);

    const mutation = useMutation({
        mutationFn: async () => {
            const t = await getToken();
            return createPost(
                {
                    caption,
                    images: imageUrls.map((u) => u.trim()).filter(Boolean),
                    linkedPromptId: linkedPromptId || undefined,
                    tags: tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                },
                t,
            );
        },
        onSuccess: () => {
            setCaption("");
            setImageUrls([""]);
            setLinkedPromptId(null);
            setTags("");
            setShowImages(false);
            queryClient.invalidateQueries(["feedPosts"]);
            queryClient.invalidateQueries(["followingPosts"]);
            onSuccess?.();
        },
    });

    const addImageField = () => setImageUrls((prev) => [...prev, ""]);
    const updateImage = (i, val) =>
        setImageUrls((prev) => {
            const n = [...prev];
            n[i] = val;
            return n;
        });
    const removeImage = (i) =>
        setImageUrls((prev) => prev.filter((_, idx) => idx !== i));

    return (
        <div className="bg-[#0A0A0A] border border-white/8 rounded-3xl p-6 mb-8">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0 mt-1">
                    {user?.username?.[0]?.toUpperCase() ?? "?"}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Caption */}
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Share your AI output, generation result, or creative workflow..."
                        rows={3}
                        className="w-full bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-600 resize-none leading-relaxed"
                    />

                    {/* Image URL inputs */}
                    {showImages && (
                        <div className="space-y-2 mt-3 border-t border-white/5 pt-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <ImageIcon size={10} /> Image URLs
                            </label>
                            {imageUrls.map((url, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        value={url}
                                        onChange={(e) =>
                                            updateImage(i, e.target.value)
                                        }
                                        placeholder="https://example.com/output.png"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    {imageUrls.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="text-slate-600 hover:text-red-400 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addImageField}
                                className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                            >
                                <Plus size={10} /> Add another image
                            </button>
                        </div>
                    )}

                    {/* Tags */}
                    <div className="mt-3 border-t border-white/5 pt-3">
                        <input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Tags (comma separated): ai, art, coding..."
                            className="w-full bg-transparent border-none outline-none text-xs text-slate-400 placeholder:text-slate-700"
                        />
                    </div>

                    {/* Image previews */}
                    {imageUrls.filter(Boolean).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {imageUrls.filter(Boolean).map((url, i) => (
                                <div
                                    key={i}
                                    className="relative size-16 rounded-lg overflow-hidden border border-white/10 bg-white/5"
                                >
                                    <img
                                        src={url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions bar */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setShowImages(!showImages)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                showImages
                                    ? "bg-blue-500/10 border-blue-500/25 text-blue-300"
                                    : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-400"
                            }`}
                        >
                            <ImageIcon size={12} /> Images
                        </button>

                        <PromptLinker
                            value={linkedPromptId}
                            onChange={setLinkedPromptId}
                            token={token}
                        />

                        <button
                            type="button"
                            onClick={() => mutation.mutate()}
                            disabled={!caption.trim() || mutation.isPending}
                            className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-blue-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {mutation.isPending ? "Posting…" : "Post"}
                            <Send size={12} />
                        </button>
                    </div>

                    {mutation.isError && (
                        <p className="text-xs text-red-400 mt-2">
                            {mutation.error?.response?.data?.message ||
                                "Failed to create post"}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post }) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const queryClient = useQueryClient();

    const clerkUserId = user?.id;
    const isLiked = post.isLiked;

    const likeMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleLikePost(post._id, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["feedPosts"]);
            queryClient.invalidateQueries(["followingPosts"]);
        },
    });

    const author = post.authorId;
    const linkedPrompt = post.linkedPromptId;

    return (
        <article className="bg-[#0A0A0A] border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <Link
                    to="/user/$id"
                    params={{ id: post.authorId?.clerkId }}
                    className="flex items-center gap-3 group/author"
                >
                    <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0 group-hover/author:ring-2 group-hover/author:ring-blue-500/30 transition-all">
                        {(author?.username ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate group-hover/author:text-blue-400 transition-colors">
                            {author?.fullName || author?.username || "Unknown"}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span>@{author?.username ?? "unknown"}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                                <Clock size={8} />
                                {timeAgo(post.createdAt)}
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Caption */}
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">
                {post.caption}
            </p>

            {/* Images */}
            {post.images?.length > 0 && (
                <div
                    className={`grid gap-2 mb-4 ${
                        post.images.length === 1
                            ? "grid-cols-1"
                            : post.images.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-2 md:grid-cols-3"
                    }`}
                >
                    {post.images.map((url, i) => (
                        <div
                            key={i}
                            className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] aspect-video"
                        >
                            <img
                                src={url}
                                alt={`Output ${i + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                    e.target.src = "";
                                    e.target.alt = "Image failed to load";
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Linked Prompt */}
            {linkedPrompt && (
                <Link
                    to="/prompt/$id"
                    params={{ id: linkedPrompt._id }}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 hover:border-purple-500/30 transition-all mb-4"
                >
                    <div className="size-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                        <Link2 size={14} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-purple-300 truncate group-hover:text-purple-200 transition-colors">
                            {linkedPrompt.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold bg-purple-500/10 px-1.5 py-0.5 rounded text-purple-400 uppercase tracking-wider">
                                {linkedPrompt.category}
                            </span>
                            {linkedPrompt.modelSupport?.slice(0, 2).map((m) => (
                                <span
                                    key={m}
                                    className="text-[9px] text-slate-600 flex items-center gap-0.5"
                                >
                                    <Cpu size={7} />
                                    {m}
                                </span>
                            ))}
                            {linkedPrompt.isTemplate && (
                                <span className="text-[8px] font-bold text-amber-400 flex items-center gap-0.5">
                                    <Zap size={7} fill="currentColor" />{" "}
                                    Template
                                </span>
                            )}
                        </div>
                    </div>
                    <ArrowUpRight
                        size={13}
                        className="text-purple-500/40 group-hover:text-purple-400 transition-colors shrink-0"
                    />
                </Link>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.map((t) => (
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

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button
                    type="button"
                    onClick={() => likeMutation.mutate()}
                    disabled={likeMutation.isPending}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                        isLiked
                            ? "text-pink-400"
                            : "text-slate-500 hover:text-pink-400"
                    }`}
                >
                    <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                    {post.likesCount ?? 0}
                </button>
            </div>
        </article>
    );
}

// ─── Main Feed Page ────────────────────────────────────────────────────────────
function FeedPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-blue-500/30">
            <SignedIn>
                <FeedContent />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function FeedContent() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [feedMode, setFeedMode] = useState("all"); // "all" or "following"
    const [page, setPage] = useState(1);

    // All posts query
    const allQuery = useQuery({
        queryKey: ["feedPosts", page],
        queryFn: () => fetchAllPosts(page),
        enabled: feedMode === "all",
    });

    // Following posts query
    const followingQuery = useQuery({
        queryKey: ["followingPosts", page],
        queryFn: async () => {
            const token = await getToken();
            return fetchFollowingPosts(token, page);
        },
        enabled: feedMode === "following",
    });

    const activeQuery = feedMode === "all" ? allQuery : followingQuery;
    const posts = activeQuery.data?.posts ?? [];
    const hasMore = activeQuery.data?.hasMore ?? false;
    const total = activeQuery.data?.total ?? 0;

    console.log(activeQuery.data);

    const switchMode = (mode) => {
        setFeedMode(mode);
        setPage(1);
    };

    return (
        <>
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] left-[30%] w-[40%] h-[40%] bg-blue-600/6 blur-[140px] rounded-full" />
                <div className="absolute top-[50%] -right-[15%] w-[30%] h-[30%] bg-purple-600/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-black/30 backdrop-blur-md">
                <div className="max-w-2xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-black text-white flex items-center gap-2">
                                <Flame size={22} className="text-orange-400" />
                                Feed
                            </h1>
                            <p className="text-xs text-slate-600 mt-0.5">
                                See what creators are building with AI
                            </p>
                        </div>
                        {!activeQuery.isLoading && (
                            <span className="text-xs text-slate-600">
                                {total} posts
                            </span>
                        )}
                    </div>

                    {/* Toggle: All / Following */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/3 border border-white/8 w-fit">
                        <button
                            type="button"
                            onClick={() => switchMode("all")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                feedMode === "all"
                                    ? "bg-white/8 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <Globe size={13} /> For You
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode("following")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                feedMode === "following"
                                    ? "bg-white/8 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <Users size={13} /> Following
                        </button>
                    </div>
                </div>
            </header>

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-6">
                {/* Composer */}
                <PostComposer />

                {/* Posts */}
                {activeQuery.isLoading ? (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-48 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse"
                            />
                        ))}
                    </div>
                ) : activeQuery.isError ? (
                    <div className="text-center py-16">
                        <p className="text-red-400 text-sm">
                            Failed to load feed. Please try again.
                        </p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
                            {feedMode === "following" ? (
                                <Users size={24} className="text-slate-600" />
                            ) : (
                                <Sparkles
                                    size={24}
                                    className="text-slate-600"
                                />
                            )}
                        </div>
                        <p className="text-lg font-semibold text-white mb-1">
                            {feedMode === "following"
                                ? "No posts from people you follow"
                                : "No posts yet"}
                        </p>
                        <p className="text-sm text-slate-500 max-w-sm">
                            {feedMode === "following"
                                ? "Follow some creators to see their posts here, or switch to the For You tab."
                                : "Be the first to share your AI creations! Use the composer above to post."}
                        </p>
                        {feedMode === "following" && (
                            <button
                                type="button"
                                onClick={() => switchMode("all")}
                                className="mt-4 text-xs px-4 py-2 rounded-full border border-white/10 text-slate-400 hover:border-blue-500/30 hover:text-blue-300 transition-all"
                            >
                                Switch to For You
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard key={post._id} post={post} />
                        ))}

                        {/* Pagination */}
                        {(hasMore || page > 1) && (
                            <div className="flex items-center justify-center gap-3 pt-6">
                                {page > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => p - 1)}
                                        className="text-xs px-4 py-2 rounded-full border border-white/10 text-slate-400 hover:border-white/20 transition-all"
                                    >
                                        Previous
                                    </button>
                                )}
                                <span className="text-xs text-slate-600">
                                    Page {page}
                                </span>
                                {hasMore && (
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => p + 1)}
                                        className="text-xs px-4 py-2 rounded-full border border-white/10 text-slate-400 hover:border-white/20 transition-all"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
