import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    SignedIn,
    SignedOut,
    RedirectToSignIn,
    useAuth,
} from "@clerk/clerk-react";

import { fetchMySavedPrompts } from "../lib/promptApi.js";

import {
    Bookmark,
    Heart,
    Layers,
    Utensils,
    Clock,
    Folder,
    ChevronRight,
    Loader2,
} from "lucide-react";

export const Route = createFileRoute("/saved")({
    component: SavedPromptsPage,
});

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function SavedPromptsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-200">
            <SignedIn>
                <SavedPromptsContent />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function SavedPromptsContent() {
    const { getToken, isLoaded } = useAuth();

    const {
        data: prompts = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["savedPrompts"],
        queryFn: async () => {
            const token = await getToken();
            return fetchMySavedPrompts(token);
        },
        enabled: isLoaded,
    });

    return (
        <>
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-600/8 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-600/8 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
                {/* Hero */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-600/20 rounded-2xl">
                            <Bookmark className="text-amber-400" size={22} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Saved{" "}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-400">
                                Prompts.
                            </span>
                        </h1>
                    </div>
                    <p className="text-lg text-slate-400">
                        Your personal collection of bookmarked prompts — ready
                        when you need them.
                    </p>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2
                            className="animate-spin text-amber-500"
                            size={40}
                        />
                        <p className="text-slate-500 font-medium animate-pulse">
                            Loading your saved prompts...
                        </p>
                    </div>
                ) : isError ? (
                    <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20 text-center">
                        <p className="text-red-400 font-bold">
                            Failed to load saved prompts.
                        </p>
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="size-16 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-center mb-4">
                            <Bookmark size={24} className="text-slate-600" />
                        </div>
                        <p className="text-lg font-semibold text-white mb-1">
                            No saved prompts yet
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            Explore and bookmark prompts you love to find them
                            here later.
                        </p>
                        <Link
                            to="/explore"
                            className="flex items-center gap-2 text-xs px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all"
                        >
                            Explore Prompts
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Result count */}
                        <div className="flex items-center justify-between mb-6 border-b border-white/6 pb-4">
                            <span className="text-xs text-slate-600 font-medium">
                                {prompts.length} saved prompt
                                {prompts.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {prompts.map((p) => (
                                <SavedPromptCard key={p._id} prompt={p} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

function SavedPromptCard({ prompt }) {
    const author = prompt.authorId;

    return (
        <Link
            to="/prompt/$id"
            params={{ id: prompt._id }}
            className="group flex flex-col bg-[#0A0A0A] border border-white/5 hover:border-amber-500/30 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),0_0_20px_rgba(245,158,11,0.08)]"
        >
            {/* Top row: author + category */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="size-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {(
                            author?.username?.[0] ??
                            author?.fullName?.[0] ??
                            "?"
                        ).toUpperCase()}
                    </div>
                    <span className="text-[12px] font-semibold text-slate-500 truncate">
                        @{author?.username ?? "unknown"}
                    </span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-widest shrink-0">
                    <Folder size={9} />
                    {prompt.category}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-[17px] font-bold text-white mb-2 line-clamp-1 group-hover:text-amber-400 transition-colors leading-snug flex items-center gap-1">
                {prompt.title}
                <ChevronRight
                    size={14}
                    className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0"
                />
            </h3>

            {/* Preview text */}
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                {prompt.promptText}
            </p>

            {/* Tags */}
            {prompt.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {prompt.tags.slice(0, 5).map((t) => (
                        <span
                            key={t}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-500"
                        >
                            #{t}
                        </span>
                    ))}
                    {prompt.tags.length > 5 && (
                        <span className="text-[10px] text-slate-600 self-center">
                            +{prompt.tags.length - 5}
                        </span>
                    )}
                </div>
            )}

            {/* Footer stats */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-slate-500">
                    <div className="flex items-center gap-1 hover:text-red-400 transition-colors">
                        <Heart size={13} />
                        <span className="text-xs font-medium">
                            {prompt.likesCount ?? 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-white transition-colors">
                        <Utensils size={13} />
                        <span className="text-xs font-medium">
                            {prompt.forksCount ?? 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-white transition-colors">
                        <Layers size={13} />
                        <span className="text-xs font-medium">
                            {prompt.copiesCount ?? 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-amber-400 transition-colors">
                        <Bookmark size={13} className="fill-current" />
                        <span className="text-xs font-medium">
                            {prompt.savesCount ?? 0}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock size={10} />
                    {timeAgo(prompt.createdAt)}
                </div>
            </div>
        </Link>
    );
}
