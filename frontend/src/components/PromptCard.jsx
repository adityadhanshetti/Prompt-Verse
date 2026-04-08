import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Folder,
    Heart,
    Layers,
    Utensils,
    Bookmark,
    Copy,
    Check,
    ChevronRight,
    Play,
} from "lucide-react";
import { toggleLikePrompt, toggleSavePrompt, incrementCopyCount } from "../lib/promptApi.js";

export default function PromptCard({ prompt }) {
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState(!!prompt.isLiked);
    const [saved, setSaved] = useState(!!prompt.isSaved);
    const [likesCount, setLikesCount] = useState(prompt.likesCount ?? 0);
    const [savesCount, setSavesCount] = useState(prompt.savesCount ?? 0);
    const [copiesCount, setCopiesCount] = useState(prompt.copiesCount ?? 0);

    const { getToken, isSignedIn } = useAuth();
    const queryClient = useQueryClient();

    // authorId is the populated User object from backend
    const promptCreatorClerkId = prompt.authorId?.clerkId;
    const { fullName = "Demo User", username = "demo" } =
        prompt.authorId || {};

    const handleCopy = async (e) => {
        e.preventDefault();
        await navigator.clipboard.writeText(prompt.promptText);
        setCopied(true);
        setCopiesCount((prev) => prev + 1);
        setTimeout(() => setCopied(false), 2000);
        try {
            const data = await incrementCopyCount(prompt._id);
            if (data.copiesCount != null) setCopiesCount(data.copiesCount);
        } catch {}
    };

    const likeMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleLikePrompt(prompt._id, token);
        },
        onMutate: () => {
            // optimistic update
            setLiked((prev) => !prev);
            setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
        },
        onSuccess: (data) => {
            setLiked(data.liked);
            setLikesCount(data.likesCount);
        },
        onError: () => {
            // revert on error
            setLiked((prev) => !prev);
            setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["prompts"] });
            queryClient.invalidateQueries({ queryKey: ["explorePrompts"] });
        },
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleSavePrompt(prompt._id, token);
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
            queryClient.invalidateQueries({ queryKey: ["savedPrompts"] });
            queryClient.invalidateQueries({ queryKey: ["prompts"] });
            queryClient.invalidateQueries({ queryKey: ["explorePrompts"] });
        },
    });

    return (
        <div className="group relative bg-[#0f1117] border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-blue-500/50 hover:bg-[#161922] hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]">
            {/* Top Row: User Info & Actions */}
            <div className="flex items-center justify-between mb-5">
                <Link
                    to="/user/$id"
                    params={{ id: promptCreatorClerkId }}
                    className="flex items-center gap-3 group/author"
                >
                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-purple-500 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/5 group-hover/author:ring-blue-500/30 transition-all">
                        {fullName ? fullName[0] : "D"}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-100 leading-none group-hover/author:text-blue-400 transition-colors">
                            {fullName || "DEMO"}
                        </h4>
                        <span className="text-xs text-gray-500 group-hover/author:text-blue-400/70 transition-colors">
                            @{username}
                        </span>
                    </div>
                </Link>

                {/* <Link
                    to="/playground"
                    search={{ text: prompt.promptText }}
                    className="p-2 rounded-lg border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all duration-200 cursor-pointer"
                    title="Try in Playground"
                >
                    <Play size={16} />
                </Link> */}
            </div>

            {/* Content Section */}
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <Link
                        to="/prompt/$id"
                        params={{ id: prompt._id }}
                        className="group/title flex items-center gap-1 text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors"
                    >
                        <span className="line-clamp-1">{prompt.title}</span>
                        <ChevronRight
                            size={16}
                            className="opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all"
                        />
                    </Link>
                </div>

                <Link
                    to="/category/$category"
                    params={{ category: prompt.category }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-[11px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                    <Folder size={12} />
                    {prompt.category}
                </Link>

                <div className="relative group/text bg-linear-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4">
                    <div className="absolute -inset-2 bg-linear-to-l from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover/text:opacity-100 transition-opacity" />
                    <p className="relative text-sm text-gray-400 line-clamp-3 leading-relaxed">
                        {prompt.promptText}
                    </p>
                </div>
            </div>

            {/* Tags */}
            {prompt.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-5">
                    {prompt.tags.slice(0, 3).map((tag, i) => (
                        <Link
                            key={i}
                            to="/tag/$tag"
                            params={{ tag }}
                            className="text-[12px] font-medium text-gray-500 hover:text-white transition-colors"
                        >
                            #{tag}
                        </Link>
                    ))}
                </div>
            )}

            {/* Footer Stats with Interactive Like/Save */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                        onClick={() =>
                            isSignedIn && likeMutation.mutate()
                        }
                        disabled={likeMutation.isPending}
                        className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                            liked
                                ? "text-red-400"
                                : "text-gray-500 hover:text-red-400"
                        }`}
                        title={isSignedIn ? (liked ? "Unlike" : "Like") : "Sign in to like"}
                    >
                        <Heart
                            size={15}
                            className={`transition-transform duration-200 ${liked ? "scale-110" : ""}`}
                            fill={liked ? "currentColor" : "none"}
                        />
                        <span className="text-xs font-semibold">
                            {likesCount}
                        </span>
                    </button>

                    {/* Uses (copies) */}
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <Layers size={14} />
                        <span className="text-xs font-semibold">
                            {copiesCount}
                        </span>
                    </div>

                    {/* Forks — static display */}
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <Utensils size={14} />
                        <span className="text-xs font-semibold">
                            {prompt.forksCount ?? 0}
                        </span>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={() =>
                        isSignedIn && saveMutation.mutate()
                    }
                    disabled={saveMutation.isPending}
                    className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                        saved
                            ? "text-amber-400"
                            : "text-gray-500 hover:text-amber-400"
                    }`}
                    title={isSignedIn ? (saved ? "Unsave" : "Save") : "Sign in to save"}
                >
                    <Bookmark
                        size={15}
                        className={`transition-transform duration-200 ${saved ? "scale-110" : ""}`}
                        fill={saved ? "currentColor" : "none"}
                    />
                    <span className="text-xs font-semibold">{savesCount}</span>
                </button>
            </div>
        </div>
    );
}
