import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    SignedIn,
    SignedOut,
    useAuth,
    useUser,
    UserProfile,
} from "@clerk/clerk-react";

import {
    fetchUserProfileStats,
    getUserByUserId,
    fetchUserFollowers,
    fetchUserFollowing,
    fetchUserPosts,
} from "../../lib/userApi.js";
import {
    fetchPromptsByUserId,
    fetchMySavedPrompts,
    deletePromptById,
} from "../../lib/promptApi.js";
import {
    fetchCollectionsByUserId,
    deleteCollection,
} from "../../lib/collectionApi.js";
import { deletePost } from "../../lib/postApi.js";

import {
    followUser,
    unfollowUser,
    checkFollowing,
} from "../../lib/followApi.js";

export const Route = createFileRoute("/user/$id")({
    component: UserProfilePage,
});

// ─── Icon Components ────────────────────────────────────────────────────
function IconUsers({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
function IconFileText({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    );
}
function IconMessageSquare({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function IconLayers({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    );
}
function IconBookmark({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    );
}
function IconSettings({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
function IconHeart({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
    );
}
function IconGitFork({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
            <path d="M12 12v3" />
        </svg>
    );
}
function IconCopy({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}
function IconExternalLink({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
        </svg>
    );
}
function IconCalendar({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    );
}
function IconImage({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    );
}
function IconTrash({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
    );
}

// ─── Tab Config ─────────────────────────────────────────────────────────
const TABS = [
    { key: "prompts", label: "Prompts", icon: IconFileText },
    { key: "posts", label: "Posts", icon: IconMessageSquare },
    { key: "collections", label: "Collections", icon: IconLayers },
    { key: "saved", label: "Saved", icon: IconBookmark, ownerOnly: true },
    { key: "followers", label: "Followers", icon: IconUsers },
    { key: "following", label: "Following", icon: IconUsers },
    { key: "settings", label: "Settings", icon: IconSettings, ownerOnly: true },
];

// ─── Main Component ─────────────────────────────────────────────────────
function UserProfilePage() {
    const { id } = Route.useParams();
    const { user } = useUser();
    const { getToken, isLoaded } = useAuth();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState("prompts");

    const isMyProfile = user?.id === id;

    // ── User Info (from Clerk via backend) ──
    const { data: profileUser, isLoading: profileUserLoading } = useQuery({
        queryKey: ["userProfile", id],
        queryFn: () => getUserByUserId(id),
    });

    // ── Profile Stats ──
    const {
        data: stats,
        isLoading: statsLoading,
        isError: statsError,
    } = useQuery({
        queryKey: ["userProfileStats", id],
        queryFn: () => fetchUserProfileStats(id),
    });

    // ── Prompts ──
    const { data: userPrompts = [], isLoading: promptsLoading } = useQuery({
        queryKey: ["userPrompts", id],
        queryFn: () => fetchPromptsByUserId(id),
    });

    // ── Collections ──
    const { data: userCollections = [], isLoading: collectionsLoading } =
        useQuery({
            queryKey: ["userCollections", id],
            queryFn: () => fetchCollectionsByUserId(id),
        });

    // ── Posts ──
    const { data: userPosts = [], isLoading: postsLoading } = useQuery({
        queryKey: ["userPosts", id],
        queryFn: () => fetchUserPosts(id),
    });

    // ── Followers ──
    const { data: followers = [], isLoading: followersLoading } = useQuery({
        queryKey: ["userFollowers", id],
        queryFn: () => fetchUserFollowers(id),
        enabled: activeTab === "followers",
    });

    // ── Following ──
    const { data: following = [], isLoading: followingLoading } = useQuery({
        queryKey: ["userFollowing", id],
        queryFn: () => fetchUserFollowing(id),
        enabled: activeTab === "following",
    });

    // ── Saved Prompts (own profile only) ──
    const { data: savedPrompts = [], isLoading: savedLoading } = useQuery({
        queryKey: ["mySavedPrompts"],
        queryFn: async () => {
            const token = await getToken();
            return fetchMySavedPrompts(token);
        },
        enabled: isMyProfile && activeTab === "saved",
    });

    // ── Following Check ──
    const { data: followingData } = useQuery({
        queryKey: ["isFollowing", id],
        queryFn: async () => {
            const token = await getToken();
            return checkFollowing(id, token);
        },
        enabled: isLoaded && !!user && !isMyProfile,
    });

    const isFollowing = followingData?.isFollowing;

    // ── Follow / Unfollow Mutations ──
    const followMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return followUser(id, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["isFollowing", id]);
            queryClient.invalidateQueries(["userProfileStats", id]);
            queryClient.invalidateQueries(["userFollowers", id]);
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return unfollowUser(id, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["isFollowing", id]);
            queryClient.invalidateQueries(["userProfileStats", id]);
            queryClient.invalidateQueries(["userFollowers", id]);
        },
    });

    // ══════════════════════════════════════════════════════════════
    // DELETE MUTATIONS
    // ══════════════════════════════════════════════════════════════
    const deletePromptMutation = useMutation({
        mutationFn: async (promptId) => {
            const token = await getToken();
            return deletePromptById(promptId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["userPrompts", id]);
            queryClient.invalidateQueries(["userProfileStats", id]);
        },
    });

    const deletePostMutation = useMutation({
        mutationFn: async (postId) => {
            const token = await getToken();
            return deletePost(postId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["userPosts", id]);
            queryClient.invalidateQueries(["userProfileStats", id]);
        },
    });

    const deleteCollectionMutation = useMutation({
        mutationFn: async (collectionId) => {
            const token = await getToken();
            return deleteCollection(collectionId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["userCollections", id]);
            queryClient.invalidateQueries(["userProfileStats", id]);
        },
    });

    // ── Confirm + Delete Helpers ──
    const handleDeletePrompt = (promptId, title) => {
        if (
            window.confirm(
                `Delete prompt "${title}"? This action cannot be undone.`,
            )
        ) {
            deletePromptMutation.mutate(promptId);
        }
    };

    const handleDeletePost = (postId) => {
        if (window.confirm("Delete this post? This action cannot be undone.")) {
            deletePostMutation.mutate(postId);
        }
    };

    const handleDeleteCollection = (collectionId, title) => {
        if (
            window.confirm(
                `Delete collection "${title}"? This will not delete the prompts inside it.`,
            )
        ) {
            deleteCollectionMutation.mutate(collectionId);
        }
    };

    // ── Loading / Error States ──
    if (statsLoading || profileUserLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
                    <div className="w-48 h-6 rounded-lg bg-white/5 animate-pulse" />
                    <div className="w-32 h-4 rounded-lg bg-white/5 animate-pulse" />
                    <div className="grid grid-cols-4 gap-4 mt-6 w-full max-w-xl">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-20 rounded-xl bg-white/5 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (statsError) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <span className="text-red-400 text-lg">⚠</span>
                    <p className="text-red-400 font-medium">
                        Failed to load profile. Please try again.
                    </p>
                </div>
            </div>
        );
    }

    const displayUser = profileUser || {};
    const memberSince = displayUser.createdAt
        ? new Date(displayUser.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
          })
        : null;

    return (
        <div className="max-w-6xl mx-auto px-4 pb-16">
            {/* ═══════════════════════════════════════════════════════════
                HERO HEADER
               ═══════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-3xl border border-white/6 bg-linear-to-br from-[#0d1117] via-[#111827] to-[#0d1117] p-8 md:p-10 mt-2">
                {/* Decorative orbs */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    {/* User Info */}
                    <div className="flex gap-5 items-center">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                            {displayUser.avatar ? (
                                <img
                                    src={displayUser.avatar}
                                    alt={displayUser.fullName}
                                    className="relative w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-white/10"
                                />
                            ) : (
                                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl md:text-4xl font-black text-white border-2 border-white/10">
                                    {displayUser.fullName?.[0]?.toUpperCase() ||
                                        "?"}
                                </div>
                            )}
                            {isMyProfile && (
                                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#111827]" />
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                {displayUser.fullName || "Unknown User"}
                            </h1>
                            {displayUser.username && (
                                <p className="text-gray-400 text-sm font-medium">
                                    @{displayUser.username}
                                </p>
                            )}
                            {displayUser.bio && (
                                <p className="text-gray-300/70 text-sm mt-1 max-w-md leading-relaxed">
                                    {displayUser.bio}
                                </p>
                            )}
                            {memberSince && (
                                <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs">
                                    <IconCalendar />
                                    <span>Joined {memberSince}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                        <SignedIn>
                            {!isMyProfile && (
                                <>
                                    {isFollowing ? (
                                        <button
                                            onClick={() =>
                                                unfollowMutation.mutate()
                                            }
                                            disabled={
                                                unfollowMutation.isPending
                                            }
                                            className="group relative px-6 py-2.5 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-gray-300 transition-all duration-300"
                                        >
                                            <span className="group-hover:hidden">
                                                Following
                                            </span>
                                            <span className="hidden group-hover:inline">
                                                {unfollowMutation.isPending
                                                    ? "..."
                                                    : "Unfollow"}
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                followMutation.mutate()
                                            }
                                            disabled={followMutation.isPending}
                                            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:shadow-blue-500/30 active:scale-95"
                                        >
                                            {followMutation.isPending
                                                ? "Following..."
                                                : "Follow"}
                                        </button>
                                    )}
                                </>
                            )}
                            {isMyProfile && (
                                <button
                                    onClick={() => setActiveTab("settings")}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all duration-300 flex items-center gap-2"
                                >
                                    <IconSettings className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            )}
                        </SignedIn>
                        <SignedOut>
                            <Link
                                to="/sign-in"
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-500/30 active:scale-95"
                            >
                                Sign in to Follow
                            </Link>
                        </SignedOut>
                    </div>
                </div>

                {/* ── Stats Grid ── */}
                <div className="relative grid grid-cols-3 md:grid-cols-6 gap-3 mt-8">
                    <StatCard
                        label="Followers"
                        value={stats.followersCount}
                        onClick={() => setActiveTab("followers")}
                        active={activeTab === "followers"}
                    />
                    <StatCard
                        label="Following"
                        value={stats.followingCount}
                        onClick={() => setActiveTab("following")}
                        active={activeTab === "following"}
                    />
                    <StatCard
                        label="Prompts"
                        value={stats.promptsCount}
                        onClick={() => setActiveTab("prompts")}
                        active={activeTab === "prompts"}
                    />
                    <StatCard
                        label="Posts"
                        value={stats.postsCount}
                        onClick={() => setActiveTab("posts")}
                        active={activeTab === "posts"}
                    />
                    <StatCard
                        label="Collections"
                        value={stats.collectionsCount}
                        onClick={() => setActiveTab("collections")}
                        active={activeTab === "collections"}
                    />
                    {isMyProfile && (
                        <StatCard
                            label="Saved"
                            value={stats.savedPromptsCount}
                            onClick={() => setActiveTab("saved")}
                            active={activeTab === "saved"}
                        />
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                CONTENT AREA
               ═══════════════════════════════════════════════════════════ */}
            <div className="mt-8 flex flex-col lg:flex-row gap-8">
                {/* ── Main Content ── */}
                <div className="flex-1 min-w-0">
                    {/* Tab Navigation */}
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none mb-6">
                        {TABS.filter((t) => !t.ownerOnly || isMyProfile).map(
                            (tab) => {
                                const Icon = tab.icon;
                                const countMap = {
                                    prompts: stats.promptsCount,
                                    posts: stats.postsCount,
                                    collections: stats.collectionsCount,
                                    followers: stats.followersCount,
                                    following: stats.followingCount,
                                };
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                                            activeTab === tab.key
                                                ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                                                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4 opacity-70" />
                                        {tab.label}
                                        {countMap[tab.key] !== undefined && (
                                            <span className="text-xs opacity-50">
                                                ({countMap[tab.key]})
                                            </span>
                                        )}
                                    </button>
                                );
                            },
                        )}
                    </div>

                    {/* ── TAB: Prompts ── */}
                    {activeTab === "prompts" && (
                        <TabContent
                            loading={promptsLoading}
                            empty={userPrompts.length === 0}
                            emptyIcon={
                                <IconFileText className="w-10 h-10 text-gray-600" />
                            }
                            emptyTitle="No prompts yet"
                            emptyDescription={
                                isMyProfile
                                    ? "Create your first prompt to get started!"
                                    : "This user hasn't published any prompts yet."
                            }
                            emptyAction={
                                isMyProfile
                                    ? { to: "/create", label: "Create Prompt" }
                                    : null
                            }
                        >
                            <div className="flex flex-col gap-3">
                                {userPrompts.map((p) => (
                                    <PromptCard
                                        key={p._id}
                                        prompt={p}
                                        isOwner={isMyProfile}
                                        onDelete={() =>
                                            handleDeletePrompt(p._id, p.title)
                                        }
                                        isDeleting={
                                            deletePromptMutation.isPending
                                        }
                                    />
                                ))}
                            </div>
                        </TabContent>
                    )}

                    {/* ── TAB: Posts ── */}
                    {activeTab === "posts" && (
                        <TabContent
                            loading={postsLoading}
                            empty={userPosts.length === 0}
                            emptyIcon={
                                <IconMessageSquare className="w-10 h-10 text-gray-600" />
                            }
                            emptyTitle="No posts yet"
                            emptyDescription={
                                isMyProfile
                                    ? "Share your first prompt showcase!"
                                    : "This user hasn't created any posts yet."
                            }
                            emptyAction={
                                isMyProfile
                                    ? { to: "/feed", label: "Create Post" }
                                    : null
                            }
                        >
                            <div className="flex flex-col gap-3">
                                {userPosts.map((post) => (
                                    <PostCard
                                        key={post._id}
                                        post={post}
                                        isOwner={isMyProfile}
                                        onDelete={() =>
                                            handleDeletePost(post._id)
                                        }
                                        isDeleting={
                                            deletePostMutation.isPending
                                        }
                                    />
                                ))}
                            </div>
                        </TabContent>
                    )}

                    {/* ── TAB: Collections ── */}
                    {activeTab === "collections" && (
                        <TabContent
                            loading={collectionsLoading}
                            empty={userCollections.length === 0}
                            emptyIcon={
                                <IconLayers className="w-10 h-10 text-gray-600" />
                            }
                            emptyTitle="No collections yet"
                            emptyDescription={
                                isMyProfile
                                    ? "Organize your prompts into collections!"
                                    : "This user hasn't created any collections yet."
                            }
                            emptyAction={
                                isMyProfile
                                    ? {
                                          to: "/collections/my",
                                          label: "My Collections",
                                      }
                                    : null
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {userCollections.map((c) => (
                                    <CollectionCard
                                        key={c._id}
                                        collection={c}
                                        isOwner={isMyProfile}
                                        onDelete={() =>
                                            handleDeleteCollection(
                                                c._id,
                                                c.title,
                                            )
                                        }
                                        isDeleting={
                                            deleteCollectionMutation.isPending
                                        }
                                    />
                                ))}
                            </div>
                        </TabContent>
                    )}

                    {/* ── TAB: Saved ── */}
                    {activeTab === "saved" && isMyProfile && (
                        <TabContent
                            loading={savedLoading}
                            empty={savedPrompts.length === 0}
                            emptyIcon={
                                <IconBookmark className="w-10 h-10 text-gray-600" />
                            }
                            emptyTitle="No saved prompts"
                            emptyDescription="Save prompts from the explore page to find them here!"
                            emptyAction={{
                                to: "/explore",
                                label: "Explore Prompts",
                            }}
                        >
                            <div className="flex flex-col gap-3">
                                {savedPrompts.map((p) => (
                                    <PromptCard
                                        key={p._id}
                                        prompt={p}
                                        isOwner={false}
                                    />
                                ))}
                            </div>
                        </TabContent>
                    )}

                    {/* ── TAB: Followers ── */}
                    {activeTab === "followers" && (
                        <TabContent
                            loading={followersLoading}
                            empty={followers.length === 0}
                            emptyIcon={
                                <IconUsers className="w-10 h-10 text-gray-600" />
                            }
                            emptyTitle="No followers yet"
                            emptyDescription={
                                isMyProfile
                                    ? "Share your profile to gain followers!"
                                    : "This user doesn't have any followers yet."
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {followers.map((f) => (
                                    <UserCard key={f.id} user={f} />
                                ))}
                            </div>
                        </TabContent>
                    )}

                    {/* ── TAB: Following ── */}
                    {activeTab === "following" && (
                        <TabContent
                            loading={followingLoading}
                            empty={following.length === 0}
                            emptyIcon={
                                <IconUsers className="w-10 h-10 text-gray-600" />
                            }
                            emptyTitle="Not following anyone"
                            emptyDescription={
                                isMyProfile
                                    ? "Explore and follow other prompt engineers!"
                                    : "This user isn't following anyone yet."
                            }
                            emptyAction={
                                isMyProfile
                                    ? { to: "/explore", label: "Explore" }
                                    : null
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {following.map((f) => (
                                    <UserCard key={f.id} user={f} />
                                ))}
                            </div>
                        </TabContent>
                    )}

                    {/* ── TAB: Settings ── */}
                    {activeTab === "settings" && isMyProfile && (
                        <div className="rounded-2xl border border-white/6 bg-[#0d1117]/80 overflow-hidden">
                            <div className="p-6 border-b border-white/6">
                                <h3 className="text-lg font-bold text-white">
                                    Account Settings
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Manage your profile, security, and account
                                    preferences.
                                </p>
                            </div>
                            <div className="p-2 [&_.cl-rootBox]:w-full [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none [&_.cl-card]:border-none [&_.cl-headerTitle]:text-white [&_.cl-headerSubtitle]:text-gray-400 [&_.cl-formFieldLabel]:text-gray-300 [&_.cl-formFieldInput]:bg-white/5 [&_.cl-formFieldInput]:border-white/10 [&_.cl-formFieldInput]:text-white [&_.cl-profileSectionTitle]:text-white [&_.cl-profileSectionContent]:text-gray-300 [&_.cl-navbar]:hidden [&_.cl-navbarMobileMenuButton]:hidden [&_.cl-pageScrollBox]:p-4">
                                <UserProfile
                                    appearance={{
                                        elements: {
                                            rootBox: "w-full",
                                            card: "bg-transparent shadow-none border-none w-full",
                                            navbar: "hidden",
                                            navbarMobileMenuButton: "hidden",
                                            pageScrollBox: "p-4",
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Sidebar: Quick Links ── */}
                <div className="lg:w-80 shrink-0">
                    <div className="sticky top-24 flex flex-col gap-4">
                        {/* Quick Links Card */}
                        <div className="rounded-2xl border border-white/6 bg-[#0d1117]/80 p-5">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Quick Links
                            </h3>
                            <div className="flex flex-col gap-1">
                                <QuickLink
                                    to="/explore"
                                    icon={<IconExternalLink />}
                                    label="Explore Prompts"
                                />
                                <QuickLink
                                    to="/trending"
                                    icon={<IconExternalLink />}
                                    label="Trending"
                                />
                                <QuickLink
                                    to="/feed"
                                    icon={<IconExternalLink />}
                                    label="Community Feed"
                                />
                                {isMyProfile && (
                                    <>
                                        <div className="h-px bg-white/5 my-2" />
                                        <QuickLink
                                            to="/create"
                                            icon={
                                                <IconFileText className="w-4 h-4" />
                                            }
                                            label="Create Prompt"
                                        />
                                        <QuickLink
                                            to="/collections/my"
                                            icon={
                                                <IconLayers className="w-4 h-4" />
                                            }
                                            label="My Collections"
                                        />
                                        <QuickLink
                                            to="/saved"
                                            icon={
                                                <IconBookmark className="w-4 h-4" />
                                            }
                                            label="Saved Prompts"
                                        />
                                        <QuickLink
                                            to="/notifications"
                                            icon={<IconExternalLink />}
                                            label="Notifications"
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Activity Summary Card */}
                        <div className="rounded-2xl border border-white/6 bg-[#0d1117]/80 p-5">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Activity Summary
                            </h3>
                            <div className="flex flex-col gap-3">
                                <SummaryItem
                                    icon={
                                        <IconFileText className="w-4 h-4 text-blue-400" />
                                    }
                                    label="Public Prompts"
                                    value={stats.promptsCount}
                                />
                                <SummaryItem
                                    icon={
                                        <IconMessageSquare className="w-4 h-4 text-purple-400" />
                                    }
                                    label="Posts Shared"
                                    value={stats.postsCount}
                                />
                                <SummaryItem
                                    icon={
                                        <IconLayers className="w-4 h-4 text-emerald-400" />
                                    }
                                    label="Collections"
                                    value={stats.collectionsCount}
                                />
                                <SummaryItem
                                    icon={
                                        <IconUsers className="w-4 h-4 text-amber-400" />
                                    }
                                    label="Network"
                                    value={`${stats.followersCount} / ${stats.followingCount}`}
                                />
                            </div>
                        </div>

                        {/* Share Profile */}
                        {!isMyProfile && (
                            <div className="rounded-2xl border border-white/6 bg-linear-to-br from-blue-600/5 to-purple-600/5 p-5">
                                <p className="text-sm text-gray-400 mb-3">
                                    Enjoying{" "}
                                    {displayUser.fullName?.split(" ")[0]}'s
                                    prompts?
                                </p>
                                <button
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            window.location.href,
                                        )
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <IconCopy className="w-4 h-4" />
                                    Copy Profile Link
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ label, value, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={`group text-left p-4 rounded-xl border transition-all duration-300 ${
                active
                    ? "border-blue-500/30 bg-blue-500/10"
                    : "border-white/6 bg-white/2 hover:bg-white/5 hover:border-white/10"
            }`}
        >
            <p
                className={`text-xs font-medium mb-1 ${active ? "text-blue-400" : "text-gray-500"}`}
            >
                {label}
            </p>
            <p
                className={`text-xl font-bold ${active ? "text-blue-300" : "text-white"}`}
            >
                {value ?? 0}
            </p>
        </button>
    );
}

function TabContent({
    loading,
    empty,
    emptyIcon,
    emptyTitle,
    emptyDescription,
    emptyAction,
    children,
}) {
    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="h-28 rounded-xl bg-white/3 border border-white/6 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (empty) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-5">
                    {emptyIcon}
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    {emptyTitle}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mb-5">
                    {emptyDescription}
                </p>
                {emptyAction && (
                    <Link
                        to={emptyAction.to}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600/15 text-blue-400 border border-blue-500/20 hover:bg-blue-600/25 transition-all"
                    >
                        {emptyAction.label}
                    </Link>
                )}
            </div>
        );
    }

    return <>{children}</>;
}

function PromptCard({ prompt, isOwner, onDelete, isDeleting }) {
    return (
        <div className="group rounded-xl border border-white/6 bg-[#0d1117]/60 hover:bg-[#0d1117] hover:border-white/10 p-5 transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <Link
                        to="/prompt/$id"
                        params={{ id: prompt._id }}
                        className="text-base font-semibold text-white hover:text-blue-400 transition-colors line-clamp-1"
                    >
                        {prompt.title}
                    </Link>

                    <div className="flex items-center gap-3 mt-2">
                        <Link
                            to="/category/$category"
                            params={{ category: prompt.category }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            {prompt.category}
                        </Link>
                        {prompt.isTemplate && (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                Template
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {isOwner && onDelete && (
                        <button
                            onClick={onDelete}
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete prompt"
                        >
                            <IconTrash />
                        </button>
                    )}
                    <Link
                        to="/prompt/$id"
                        params={{ id: prompt._id }}
                        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <IconExternalLink />
                    </Link>
                </div>
            </div>

            {prompt.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {prompt.tags.slice(0, 5).map((t, i) => (
                        <Link
                            key={i}
                            to="/tag/$tag"
                            params={{ tag: t }}
                            className="text-xs px-2 py-0.5 rounded-md bg-white/3 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            #{t}
                        </Link>
                    ))}
                    {prompt.tags.length > 5 && (
                        <span className="text-xs text-gray-600">
                            +{prompt.tags.length - 5}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-3 flex items-center gap-5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <IconHeart className="w-3.5 h-3.5" />{" "}
                    {prompt.likesCount || 0}
                </span>
                <span className="flex items-center gap-1">
                    <IconGitFork className="w-3.5 h-3.5" />{" "}
                    {prompt.forksCount || 0}
                </span>
                <span className="flex items-center gap-1">
                    <IconCopy className="w-3.5 h-3.5" />{" "}
                    {prompt.copiesCount || 0}
                </span>
                <span className="flex items-center gap-1">
                    <IconBookmark className="w-3.5 h-3.5" />{" "}
                    {prompt.savesCount || 0}
                </span>
            </div>
        </div>
    );
}

function PostCard({ post, isOwner, onDelete, isDeleting }) {
    return (
        <div className="group rounded-xl border border-white/6 bg-[#0d1117]/60 hover:bg-[#0d1117] hover:border-white/10 p-5 transition-all duration-300">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-200 leading-relaxed line-clamp-3 flex-1">
                    {post.caption}
                </p>
                {isOwner && onDelete && (
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        title="Delete post"
                    >
                        <IconTrash />
                    </button>
                )}
            </div>

            {post.images?.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                    {post.images.slice(0, 3).map((img, i) => (
                        <img
                            key={i}
                            src={img}
                            alt="Post image"
                            className="w-24 h-24 rounded-lg object-cover border border-white/5"
                        />
                    ))}
                </div>
            )}

            {post.linkedPromptId && (
                <Link
                    to="/prompt/$id"
                    params={{
                        id: post.linkedPromptId._id || post.linkedPromptId,
                    }}
                    className="mt-3 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                    <IconFileText className="w-3.5 h-3.5" />
                    {post.linkedPromptId.title || "Linked Prompt"}
                </Link>
            )}

            {post.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {post.tags.map((t, i) => (
                        <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-md bg-white/3 text-gray-500"
                        >
                            #{t}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <IconHeart className="w-3.5 h-3.5" />{" "}
                        {post.likesCount || 0}
                    </span>
                    {post.images?.length > 0 && (
                        <span className="flex items-center gap-1">
                            <IconImage /> {post.images.length} image
                            {post.images.length > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

function CollectionCard({ collection, isOwner, onDelete, isDeleting }) {
    return (
        <div className="group rounded-xl border border-white/6 bg-[#0d1117]/60 hover:bg-[#0d1117] hover:border-white/10 p-5 transition-all duration-300">
            <div className="flex items-start gap-4">
                <Link
                    to="/collections/$id"
                    params={{ id: collection._id }}
                    className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500/20 to-blue-500/20 border border-white/5 flex items-center justify-center shrink-0"
                >
                    <IconLayers className="w-5 h-5 text-emerald-400" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <Link
                            to="/collections/$id"
                            params={{ id: collection._id }}
                            className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1"
                        >
                            {collection.title}
                        </Link>
                        {isOwner && onDelete && (
                            <button
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                title="Delete collection"
                            >
                                <IconTrash />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {collection.description || "No description"}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>{collection.prompts?.length || 0} prompts</span>
                        {collection.savesCount > 0 && (
                            <span className="flex items-center gap-1">
                                <IconBookmark className="w-3 h-3" />{" "}
                                {collection.savesCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserCard({ user: u }) {
    return (
        <Link
            to="/user/$id"
            params={{ id: u.id }}
            className="group flex items-center gap-4 rounded-xl border border-white/6 bg-[#0d1117]/60 hover:bg-[#0d1117] hover:border-white/10 p-4 transition-all duration-300"
        >
            {u.avatar ? (
                <img
                    src={u.avatar}
                    alt={u.fullName}
                    className="w-11 h-11 rounded-full object-cover border border-white/10"
                />
            ) : (
                <div className="w-11 h-11 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                    {u.fullName?.[0]?.toUpperCase() || "?"}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                    {u.fullName || "Unknown"}
                </p>
                {u.username && (
                    <p className="text-xs text-gray-500 truncate">
                        @{u.username}
                    </p>
                )}
            </div>
            <IconExternalLink className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    );
}

function QuickLink({ to, icon, label }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
            <span className="opacity-60">{icon}</span>
            {label}
        </Link>
    );
}

function SummaryItem({ icon, label, value }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                {icon}
                <span className="text-sm text-gray-400">{label}</span>
            </div>
            <span className="text-sm font-semibold text-white">{value}</span>
        </div>
    );
}
