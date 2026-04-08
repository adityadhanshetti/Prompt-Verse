import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import {
    Clipboard,
    Folder,
    Heart,
    Layers,
    Save,
    Bookmark,
    Pencil,
    Trash,
    Utensils,
    ArrowLeft,
    Share2,
    Play,
    ExternalLink,
    User,
    User2,
    GitFork,
    Check,
} from "lucide-react";

// Components & API
import ForksSection from "../../../components/ForksSection.jsx";
import ForkModal from "../../../components/ForkModal.jsx";
import TemplatePromptBox from "../../../components/TemplatePromptBox.jsx";
import VersionsSection from "../../../components/VersionsSection.jsx";
import AddToCollection from "../../../components/AddToCollection.jsx";
import {
    fetchPromptById,
    incrementCopyCount,
    forkPrompt,
    deletePromptById,
    toggleLikePrompt,
    toggleSavePrompt,
} from "../../../lib/promptApi.js";

export const Route = createFileRoute("/prompt/$id/")({
    component: PromptDetails,
});

function PromptDetails() {
    const { id } = Route.useParams();
    const queryClient = useQueryClient();
    const { getToken } = useAuth();
    const { user } = useUser();

    // Query & Mutation logic remains the same...
    const {
        data: prompt,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["prompt", id],
        queryFn: () => fetchPromptById(id),
    });

    // Like / Save / Fork state
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [savesCount, setSavesCount] = useState(0);
    const [copiesCount, setCopiesCount] = useState(0);
    const [forkModalOpen, setForkModalOpen] = useState(false);
    const [hasForked, setHasForked] = useState(false);

    // Sync state when prompt loads
    useEffect(() => {
        if (prompt) {
            setLiked(!!prompt.isLiked);
            setSaved(!!prompt.isSaved);
            setLikesCount(prompt.likesCount ?? 0);
            setSavesCount(prompt.savesCount ?? 0);
            setCopiesCount(prompt.copiesCount ?? 0);
            setHasForked(prompt.hasForked || false);
        }
    }, [prompt?._id, prompt?.isLiked, prompt?.isSaved, prompt?.likesCount, prompt?.savesCount, prompt?.copiesCount, prompt?.hasForked]);

    // Mutations (Keep your existing deleteMutation, copyMutation, forkMutation)

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return deletePromptById(id, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["prompts"]);
            window.location.href = "/";
        },
    });

    const copyMutation = useMutation({
        mutationFn: () => incrementCopyCount(id),
        onMutate: () => {
            setCopiesCount((prev) => prev + 1);
        },
        onSuccess: (data) => {
            if (data.copiesCount != null) setCopiesCount(data.copiesCount);
            queryClient.invalidateQueries(["prompt", id]);
            queryClient.invalidateQueries(["prompts"]);
        },
        onError: () => {
            setCopiesCount((prev) => prev - 1);
        },
    });

    const forkMutation = useMutation({
        mutationFn: async (forkData = {}) => {
            const token = await getToken();
            return forkPrompt(id, token, forkData);
        },
        onSuccess: (newPrompt) => {
            setForkModalOpen(false);
            queryClient.invalidateQueries(["prompt", id]);
            queryClient.invalidateQueries(["prompts"]);
            queryClient.invalidateQueries(["forks", id]);

            // redirect user to forked prompt
            window.location.href = `/prompt/${newPrompt._id}`;
        },
        onError: (error) => {
            // Handle duplicate fork (409)
            if (error?.response?.status === 409) {
                const existing = error.response.data?.existingFork;
                setHasForked(existing || true);
                setForkModalOpen(false);
                if (existing?._id) {
                    const goToFork = confirm(
                        `You've already forked this prompt as "${existing.title}". Go to your fork?`
                    );
                    if (goToFork) {
                        window.location.href = `/prompt/${existing._id}`;
                    }
                }
            }
        },
    });

    const handleCopy = async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt.promptText);
        copyMutation.mutate();
    };

    const likeMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleLikePrompt(id, token);
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
            queryClient.invalidateQueries({ queryKey: ["prompt", id] });
        },
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleSavePrompt(id, token);
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
            queryClient.invalidateQueries({ queryKey: ["prompt", id] });
            queryClient.invalidateQueries({ queryKey: ["savedPrompts"] });
        },
    });

    if (isLoading) return <LoadingSkeleton />;
    if (isError) return <ErrorState />;

    const isOwner = user?.id === prompt.authorId?.clerkId;

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 pb-20">
            {/* Top Navigation Bar */}
            <div className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link
                        to="/explore"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">
                            Back to Explore
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                            <Share2 size={18} />
                        </button>
                        {isOwner && (
                            <button
                                onClick={() =>
                                    confirm("Delete?") &&
                                    deleteMutation.mutate()
                                }
                                className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500/70 hover:text-red-500"
                            >
                                <Trash size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Fork Banner */}
                {prompt.forkedFrom && (
                    <div className="mb-8 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                <GitFork size={16} className="text-purple-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-purple-300">
                                    Forked from{" "}
                                    <Link
                                        to="/prompt/$id"
                                        params={{ id: prompt.forkedFrom._id }}
                                        className="font-bold underline underline-offset-4 decoration-purple-500/50 hover:text-white transition-colors"
                                    >
                                        {prompt.forkedFrom.title}
                                    </Link>
                                    {prompt.forkedFrom.authorId?.username && (
                                        <span className="text-purple-400/60">
                                            {" "}by{" "}
                                            <Link
                                                to="/user/$id"
                                                params={{ id: prompt.forkedFrom.authorId.clerkId }}
                                                className="font-semibold hover:text-white transition-colors"
                                            >
                                                @{prompt.forkedFrom.authorId.username}
                                            </Link>
                                        </span>
                                    )}
                                </p>
                                {(prompt.forkedFrom.likesCount > 0 || prompt.forkedFrom.forksCount > 0) && (
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {prompt.forkedFrom.likesCount > 0 && (
                                            <span className="flex items-center gap-1 text-[11px] text-purple-500/50">
                                                <Heart size={10} /> {prompt.forkedFrom.likesCount}
                                            </span>
                                        )}
                                        {prompt.forkedFrom.forksCount > 0 && (
                                            <span className="flex items-center gap-1 text-[11px] text-purple-500/50">
                                                <Utensils size={10} /> {prompt.forkedFrom.forksCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* LEFT COLUMN: Content & Main Feed */}
                    <div className="lg:col-span-8 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2 justify-between">
                                <div className="flex gap-2">
                                    <span className="px-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {prompt.category}
                                    </span>
                                    <span className="text-slate-500 text-sm">
                                        •
                                    </span>

                                    {prompt.modelSupport.map((model, idx) => (
                                        <span
                                            key={idx}
                                            className="text-slate-500 text-sm"
                                        >
                                            {model || "Universal Model"}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2 mr-2">
                                    {prompt.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="text-slate-500 text-sm"
                                        >
                                            {tag}{" "}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                                {prompt.title}
                            </h1>
                        </div>

                        {/* The "Code" Editor Style Display */}
                        <div className="group relative">
                            <div className="absolute -inset-px bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] blur-xl opacity-8 group-hover:opacity-18 transition duration-1000"></div>
                            <div className="relative bg-[#0D0D0D] border border-white/10 rounded-[2rem] overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Clipboard size={14} /> COPY PROMPT
                                    </button>
                                </div>
                                <div className="p-8 prose prose-invert prose-pre:bg-transparent max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {prompt.promptText}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Sections below the prompt */}
                        {prompt.isTemplate && (
                            <TemplatePromptBox prompt={prompt} />
                        )}
                        <VersionsSection prompt={prompt} />
                        <ForksSection promptId={id} />
                    </div>

                    {/* RIGHT COLUMN: Sidebar Stats & Author */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-28 space-y-6">
                            {/* Author Info */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex gap-1 ">
                                    <User size={16} /> Designer
                                </h3>
                                <Link
                                    to="/user/$id"
                                    params={{ id: prompt.authorId?.clerkId }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                                        {prompt.authorId?.username
                                            ?.charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                                            @{prompt.authorId?.username}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            View Profile →
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            {/* Action Card */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 space-y-4">
                                <button
                                    onClick={handleCopy}
                                    className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-400 transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <Clipboard size={18} /> Copy Prompt
                                </button>

                                {prompt.isTemplate ? (
                                    <button
                                        onClick={() => {
                                            const el =
                                                document.getElementById(
                                                    "template-generator",
                                                );
                                            if (el)
                                                el.scrollIntoView({
                                                    behavior: "smooth",
                                                });
                                        }}
                                        className="w-full bg-linear-to-r from-violet-600 to-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer text-white shadow-lg shadow-violet-600/20"
                                    >
                                        <Play size={18} /> Fill Template to Play
                                    </button>
                                ) : (
                                    <Link
                                        to="/playground"
                                        search={{ text: prompt.promptText }}
                                        className="w-full bg-linear-to-r from-violet-600 to-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer text-white shadow-lg shadow-violet-600/20"
                                    >
                                        <Play size={18} /> Try in Playground
                                    </Link>
                                )}

                                <SignedIn>
                                    <div className="grid grid-cols-2 gap-3">
                                        {hasForked ? (
                                            <Link
                                                to="/prompt/$id"
                                                params={{ id: hasForked._id || id }}
                                                className="bg-purple-500/10 border border-purple-500/25 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 text-purple-400 hover:bg-purple-500/15 transition-all text-sm"
                                            >
                                                <Check size={16} /> Forked
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    setForkModalOpen(true)
                                                }
                                                disabled={forkMutation.isPending}
                                                className="bg-white/5 border border-white/10 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-400 transition-all cursor-pointer text-sm"
                                            >
                                                <Utensils size={16} /> Fork
                                            </button>
                                        )}
                                        <AddToCollection promptId={id} />
                                    </div>
                                    {isOwner && (
                                        <Link
                                            to="/prompt/$id/edit"
                                            params={{ id }}
                                            className="w-full bg-blue-600 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all text-white"
                                        >
                                            <Pencil size={16} /> Edit Design
                                        </Link>
                                    )}
                                </SignedIn>
                            </div>

                            {/* Like & Save Action Buttons */}
                            <SignedIn>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => likeMutation.mutate()}
                                        disabled={likeMutation.isPending}
                                        className={`py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] cursor-pointer border ${
                                            liked
                                                ? "bg-red-500/15 border-red-500/30 text-red-400"
                                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                                        }`}
                                    >
                                        <Heart
                                            size={16}
                                            fill={liked ? "currentColor" : "none"}
                                            className={`transition-transform ${liked ? "scale-110" : ""}`}
                                        />
                                        {liked ? "Liked" : "Like"}
                                        <span className="text-xs opacity-60">({likesCount})</span>
                                    </button>
                                    <button
                                        onClick={() => saveMutation.mutate()}
                                        disabled={saveMutation.isPending}
                                        className={`py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] cursor-pointer border ${
                                            saved
                                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400"
                                        }`}
                                    >
                                        <Bookmark
                                            size={16}
                                            fill={saved ? "currentColor" : "none"}
                                            className={`transition-transform ${saved ? "scale-110" : ""}`}
                                        />
                                        {saved ? "Saved" : "Save"}
                                        <span className="text-xs opacity-60">({savesCount})</span>
                                    </button>
                                </div>
                            </SignedIn>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        icon: (
                                            <Heart className="text-red-500" />
                                        ),
                                        label: "Likes",
                                        val: likesCount,
                                    },
                                    {
                                        icon: (
                                            <Layers className="text-blue-500" />
                                        ),
                                        label: "Uses",
                                        val: copiesCount,
                                    },
                                    {
                                        icon: (
                                            <Utensils className="text-purple-500" />
                                        ),
                                        label: "Forks",
                                        val: prompt.forksCount,
                                    },
                                    {
                                        icon: (
                                            <Bookmark className="text-amber-500" />
                                        ),
                                        label: "Saves",
                                        val: savesCount,
                                    },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="bg-white/3 border border-white/5 p-4 rounded-2xl text-center"
                                    >
                                        <div className="flex justify-center mb-2">
                                            {stat.icon}
                                        </div>
                                        <div className="text-xl font-bold text-white">
                                            {stat.val}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Fork Modal */}
            {forkModalOpen && prompt && (
                <ForkModal
                    prompt={prompt}
                    onClose={() => setForkModalOpen(false)}
                    onFork={(data) => forkMutation.mutate(data)}
                    isPending={forkMutation.isPending}
                />
            )}
        </div>
    );
}

// Sub-components for better readability
function LoadingSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20 animate-pulse space-y-10">
            <div className="h-12 w-1/3 bg-white/5 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 h-[500px] bg-white/5 rounded-[2rem]" />
                <div className="lg:col-span-4 h-96 bg-white/5 rounded-[2rem]" />
            </div>
        </div>
    );
}

function ErrorState() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center max-w-sm">
                <div className="size-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Prompt Missing
                </h2>
                <p className="text-slate-500 mb-8">
                    This prompt might have been deleted or moved to another
                    universe.
                </p>
                <Link
                    to="/"
                    className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
