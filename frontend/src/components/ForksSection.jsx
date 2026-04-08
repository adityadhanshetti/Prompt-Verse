import { useQuery } from "@tanstack/react-query";
import { fetchForks } from "../lib/promptApi.js";
import { Link } from "@tanstack/react-router";
import { Utensils, Heart, Layers, GitFork, User2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function ForksSection({ promptId }) {
    const [expanded, setExpanded] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["forks", promptId],
        queryFn: () => fetchForks(promptId),
    });

    const forks = data?.forks ?? [];
    const totalForks = data?.totalForks ?? 0;

    if (isLoading) {
        return (
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Utensils size={14} className="text-purple-400" />
                    </div>
                    <div className="h-5 w-24 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-24 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!forks || forks.length === 0) {
        return (
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Utensils size={14} className="text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Forks</h2>
                </div>
                <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center">
                    <div className="size-12 rounded-2xl bg-purple-500/5 border border-purple-500/15 flex items-center justify-center mx-auto mb-3">
                        <GitFork size={20} className="text-purple-500/40" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">No forks yet</p>
                    <p className="text-xs text-slate-600 mt-1">
                        Be the first to fork and put your own spin on this prompt
                    </p>
                </div>
            </div>
        );
    }

    const PREVIEW_COUNT = 3;
    const displayedForks = expanded ? forks : forks.slice(0, PREVIEW_COUNT);
    const hasMore = forks.length > PREVIEW_COUNT;

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        return `${months}mo ago`;
    };

    return (
        <div className="mt-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Utensils size={14} className="text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Forks</h2>
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                        {totalForks}
                    </span>
                </div>
            </div>

            {/* Fork cards */}
            <div className="space-y-3">
                {displayedForks.map((fork, index) => (
                    <Link
                        key={fork._id}
                        to="/prompt/$id"
                        params={{ id: fork._id }}
                        className="group block"
                        style={{
                            animation: `forkCardIn 0.3s ease-out ${index * 0.05}s both`,
                        }}
                    >
                        <div className="relative bg-white/[0.02] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-purple-500/20 transition-all duration-300">
                            {/* Hover glow */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-violet-500/0 group-hover:from-purple-500/[0.03] group-hover:to-violet-500/[0.03] transition-all duration-500 pointer-events-none" />

                            <div className="relative">
                                {/* Top row: Author + Time */}
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-7 rounded-lg bg-gradient-to-br from-purple-500/80 to-violet-600/80 flex items-center justify-center text-[10px] font-bold text-white">
                                            {fork.authorId?.username
                                                ?.charAt(0)
                                                .toUpperCase() || "?"}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                                            @{fork.authorId?.username || "unknown"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Clock size={11} />
                                        <span className="text-[11px]">
                                            {timeAgo(fork.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-bold text-white/90 group-hover:text-white mb-2 transition-colors line-clamp-1">
                                    {fork.title}
                                </h3>

                                {/* Preview text */}
                                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                                    {fork.promptText?.substring(0, 150)}
                                    {fork.promptText?.length > 150 ? "..." : ""}
                                </p>

                                {/* Bottom stats row */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Heart size={12} />
                                        <span className="text-[11px] font-medium">
                                            {fork.likesCount || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Layers size={12} />
                                        <span className="text-[11px] font-medium">
                                            {fork.copiesCount || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Utensils size={12} />
                                        <span className="text-[11px] font-medium">
                                            {fork.forksCount || 0}
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    {fork.tags?.length > 0 && (
                                        <div className="ml-auto flex items-center gap-1.5 overflow-hidden">
                                            {fork.tags.slice(0, 2).map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] font-medium text-slate-500 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded-md truncate max-w-[80px]"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {fork.tags.length > 2 && (
                                                <span className="text-[10px] text-slate-600">
                                                    +{fork.tags.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Show more / less toggle */}
            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] hover:border-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    {expanded ? (
                        <>
                            <ChevronUp size={14} /> Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown size={14} /> Show {forks.length - PREVIEW_COUNT} more
                            fork{forks.length - PREVIEW_COUNT > 1 ? "s" : ""}
                        </>
                    )}
                </button>
            )}

            <style>{`
                @keyframes forkCardIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
