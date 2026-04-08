import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    SignedIn,
    SignedOut,
    RedirectToSignIn,
    useAuth,
    useUser,
} from "@clerk/clerk-react";
import {
    fetchSavedCollections,
    toggleSaveCollection,
} from "../../lib/collectionApi.js";
import {
    Layers,
    Globe,
    Clock,
    BookOpen,
    SlidersHorizontal,
    Bookmark,
    Loader2,
} from "lucide-react";

export const Route = createFileRoute("/collections/saved")({
    component: SavedCollectionsPage,
});

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function CollectionCard({ c, currentUserId }) {
    const promptCount = c.prompts?.length ?? 0;
    const hue = ((c._id?.charCodeAt(0) ?? 0) * 37) % 360;
    const gradientStyle = {
        background: `linear-gradient(135deg, hsl(${hue},60%,25%) 0%, hsl(${(hue + 60) % 360},50%,18%) 100%)`,
    };

    const creator = c.creator;
    const displayName = creator?.username
        ? `@${creator.username}`
        : (creator?.fullName ?? "unknown");
    const avatarLetter = (
        creator?.username?.[0] ??
        creator?.fullName?.[0] ??
        "?"
    ).toUpperCase();

    const isSaved = c.isSaved;

    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const saveMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return toggleSaveCollection(c._id, token);
        },
        onMutate: async () => {
            // Optimistic update for my saved collections
            const queryKeys = queryClient.getQueriesData({
                queryKey: ["mySavedCollections"],
            });

            queryKeys.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                queryClient.setQueryData(queryKey, (old) => {
                    if (!old) return old;
                    if (isSaved) {
                        return old.filter((col) => col._id !== c._id);
                    }
                    return old;
                });
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["mySavedCollections"] });
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
            <div
                className="h-20 w-full shrink-0 relative overflow-hidden"
                style={gradientStyle}
            >
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Layers size={64} />
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/10">
                    <BookOpen size={10} />
                    {promptCount} prompt{promptCount !== 1 ? "s" : ""}
                </div>
            </div>

            <div className="flex flex-col p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                        <Globe size={9} /> Public
                    </span>
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Clock size={9} />
                        {timeAgo(c.createdAt)}
                    </span>
                </div>

                <h3 className="text-[17px] font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors leading-snug">
                    {c.title}
                </h3>

                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">
                    {c.description || "No description provided."}
                </p>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 min-w-0"
                        onClick={(e) => e.preventDefault()}
                    >
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
                        title={
                            isSaved ? "Unsave collection" : "Save collection"
                        }
                    >
                        <Bookmark
                            size={13}
                            className={isSaved ? "fill-current" : ""}
                        />
                        <span className="text-[11px] font-medium">
                            {c.savesCount ?? 0}
                        </span>
                    </button>
                </div>
            </div>
        </Link>
    );
}

function SavedCollectionsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-200">
            <SignedIn>
                <SavedCollectionsContent />
            </SignedIn>

            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function SavedCollectionsContent() {
    const { getToken } = useAuth();
    const { user } = useUser();

    const {
        data: collections = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["mySavedCollections"],
        queryFn: async () => {
            const token = await getToken();
            return fetchSavedCollections(token);
        },
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                    Saved{" "}
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-fuchsia-400">
                        Collections.
                    </span>
                </h1>
                <p className="text-lg text-slate-400">
                    Your personal library of bookmarked prompt packs.
                </p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2
                        className="animate-spin text-violet-500"
                        size={40}
                    />
                    <p className="text-slate-500 font-medium animate-pulse">
                        Loading your saved collections...
                    </p>
                </div>
            ) : isError ? (
                <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20 text-center">
                    <p className="text-red-400 font-bold">
                        Failed to load saved collections.
                    </p>
                </div>
            ) : collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="size-16 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-center mb-4">
                        <Bookmark size={24} className="text-slate-600" />
                    </div>
                    <p className="text-lg font-semibold text-white mb-1">
                        No saved collections yet
                    </p>
                    <p className="text-sm text-slate-500 mb-6">
                        Explore communities and bookmark your favorite
                        collections.
                    </p>
                    <Link
                        to="/collections/explore"
                        className="flex items-center gap-2 text-xs px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all"
                    >
                        Explore Collections
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {collections.map((c) => (
                        <CollectionCard
                            key={c._id}
                            c={c}
                            currentUserId={user?.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
