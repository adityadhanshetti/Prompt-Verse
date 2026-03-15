import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    SignedIn,
    SignedOut,
    RedirectToSignIn,
    useAuth,
} from "@clerk/clerk-react";
import { fetchNotifications, markAllRead } from "../lib/notificationApi.js";
import {
    Bell,
    CheckCheck,
    UserPlus,
    Heart,
    GitFork,
    Bookmark,
    FolderPlus,
    Zap,
    Clock,
} from "lucide-react";

export const Route = createFileRoute("/notifications")({
    component: NotificationsPage,
});

function NotificationsPage() {
    return (
        <div className="min-h-screen bg-[#030712] py-12 px-4 md:px-8">
            <SignedIn>
                <NotificationsContent />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function NotificationsContent() {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    const {
        data: notifications = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const token = await getToken();
            return fetchNotifications(token);
        },
    });

    console.log(notifications);

    const markMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return markAllRead(token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["notifications"]);
            queryClient.invalidateQueries(["unreadCount"]);
        },
    });

    const getIcon = (type) => {
        switch (type) {
            case "follow":
                return <UserPlus size={16} className="text-blue-400" />;
            case "like":
                return (
                    <Heart
                        size={16}
                        className="text-pink-400"
                        fill="currentColor"
                    />
                );
            case "fork":
                return <GitFork size={16} className="text-purple-400" />;
            case "save":
                return <Bookmark size={16} className="text-yellow-400" />;
            case "collection_add":
                return <FolderPlus size={16} className="text-emerald-400" />;
            default:
                return <Zap size={16} className="text-orange-400" />;
        }
    };

    if (isError)
        return (
            <div className="max-w-2xl mx-auto text-center py-20 bg-red-500/5 rounded-3xl border border-red-500/10">
                <p className="text-red-400">
                    Failed to sync notifications. Please try again.
                </p>
            </div>
        );

    return (
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar: Controls */}
            <div className="lg:w-1/3 flex flex-col gap-6">
                <div className="sticky top-28">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-600/20 rounded-2xl">
                            <Bell className="text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            Notifications
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        Stay updated with how the community interacts with your
                        prompts and profile.
                    </p>

                    <button
                        onClick={() => markMutation.mutate()}
                        disabled={
                            markMutation.isPending || notifications.length === 0
                        }
                        className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
                    >
                        <CheckCheck size={18} />
                        {markMutation.isPending
                            ? "Syncing..."
                            : "Mark all as read"}
                    </button>
                </div>
            </div>

            {/* Right Side: Feed */}
            <div className="lg:w-2/3">
                <div className="flex flex-col gap-3">
                    {isLoading ? (
                        [1, 2, 3, 4].map((i) => (
                            <NotificationSkeleton key={i} />
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                            <p className="text-slate-500 font-medium">
                                Your inbox is clear!
                            </p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n._id}
                                className={`group relative flex gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 ${
                                    n.isRead
                                        ? "bg-transparent border-white/5 opacity-80"
                                        : "bg-white/[0.03] border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
                                } hover:bg-white/[0.05] hover:border-white/20`}
                            >
                                {/* Indicator for Unread */}
                                {!n.isRead && (
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full" />
                                )}

                                <div className="relative shrink-0">
                                    <img
                                        src={n.fromUser?.imageUrl}
                                        alt="user"
                                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5"
                                    />
                                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#030712] rounded-lg border border-white/10">
                                        {getIcon(n.type)}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <Link
                                            to="/user/$id"
                                            params={{
                                                id: n.fromUser?.id,
                                            }}
                                            className="flex items-center gap-4 group"
                                        >
                                            <p className="text-sm text-slate-300 leading-snug">
                                                <span className="font-bold text-white hover:text-blue-400 cursor-pointer transition-colors">
                                                    {n.fromUser?.username ||
                                                        "Someone"}
                                                </span>{" "}
                                                {n.message}
                                            </p>
                                        </Link>
                                    </div>

                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                            <Clock size={12} />
                                            {formatTime(n.createdAt)}
                                        </div>

                                        <div className="flex gap-2">
                                            {n.promptId && (
                                                <Link
                                                    to="/prompt/$id"
                                                    params={{ id: n.promptId }}
                                                    className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full transition-colors"
                                                >
                                                    View Prompt
                                                </Link>
                                            )}
                                            {n.collectionId && (
                                                <Link
                                                    to="/collections/$id"
                                                    params={{
                                                        id: n.collectionId,
                                                    }}
                                                    className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full transition-colors"
                                                >
                                                    Collection
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Minimal Helper for time (could use date-fns or dayjs)
function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function NotificationSkeleton() {
    return (
        <div className="flex gap-4 p-5 rounded-[1.5rem] bg-white/5 border border-white/5 animate-pulse">
            <div className="w-12 h-12 bg-white/10 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
        </div>
    );
}
