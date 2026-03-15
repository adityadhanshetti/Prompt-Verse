import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { fetchUnreadCount } from "../lib/notificationApi.js";
import {
    ChevronDown,
    Bell,
    PlusSquare,
    Compass,
    TrendingUp,
    LayoutDashboard,
    Bookmark,
    Layers,
    Zap,
    FileText,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: unreadData } = useQuery({
        queryKey: ["unreadCount"],
        queryFn: async () => {
            const token = await getToken();
            return fetchUnreadCount(token);
        },
        enabled: !!user,
        refetchInterval: 60 * 1000,
    });

    return (
        <nav className="sticky top-0 z-100 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Left: Brand & Primary Nav */}
                <div className="flex items-center gap-10">
                    <Link to="/" className="group flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-180 transition-transform ease-in-out">
                            {/* <span className="text-white font-black text-xl">
                                P
                            </span> */}
                            <Zap size={20} fill="white" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-white">
                            PromptVerse
                        </span>
                    </Link>

                    {/* Desktop Main Links */}
                    <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-400">
                        <NavLink
                            to="/explore"
                            icon={<Compass size={16} />}
                            label="Explore"
                        />
                        <NavLink
                            to="/trending"
                            icon={<TrendingUp size={16} />}
                            label="Trending"
                        />
                        <NavLink
                            to="/collections/explore"
                            icon={<Layers size={16} />}
                            label="Collections"
                        />
                        <SignedIn>
                            <NavLink
                                to="/feed"
                                icon={<LayoutDashboard size={16} />}
                                label="Feed"
                            />
                        </SignedIn>
                    </div>

                </div>

                {/* Right: Actions & User Profile */}
                <div className="flex items-center gap-3">
                    <SignedIn>
                        {/* Quick Action: Create */}
                        <div className="relative mr-2 hidden md:block">
                            <button
                                onClick={() => setIsCreateOpen(!isCreateOpen)}
                                className={`flex items-center gap-2 px-4 py-2 hover:bg-white/10 border rounded-full text-sm font-semibold transition-all ${isCreateOpen ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"}`}
                            >
                                <PlusSquare
                                    size={18}
                                    className="text-blue-400"
                                />
                                <span>Create</span>
                                <ChevronDown
                                    size={14}
                                    className={`text-gray-400 transition-transform ${isCreateOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isCreateOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsCreateOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-4 w-48 bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in duration-200 z-50">
                                        <MenuLink
                                            to="/create"
                                            icon={<FileText size={18} />}
                                            label="Create Prompt"
                                            onClick={() =>
                                                setIsCreateOpen(false)
                                            }
                                        />
                                        <MenuLink
                                            to="/collections/create"
                                            icon={<Layers size={18} />}
                                            label="Create Collection"
                                            onClick={() =>
                                                setIsCreateOpen(false)
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Notifications */}
                        <Link
                            to="/notifications"
                            className="p-2.5 hover:bg-white/5 rounded-full relative transition-colors"
                        >
                            <Bell
                                size={20}
                                className="text-gray-400 hover:text-white"
                            />
                            {unreadData?.unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-4 h-4 bg-blue-600 text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-black">
                                    {unreadData.unreadCount}
                                </span>
                            )}
                        </Link>

                        {/* Dropdown for Secondary Links */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-1 p-1 pr-2 hover:bg-white/5 rounded-full transition-colors"
                            >
                                <UserButton afterSignOutUrl="/" />
                                <ChevronDown
                                    size={14}
                                    className={`text-gray-500 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0"
                                        onClick={() => setIsMenuOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-4 w-56 bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in duration-200">
                                        <div className="px-4 py-2 mb-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                Workspace
                                            </p>
                                        </div>
                                        <MenuLink
                                            to="/collections/my"
                                            icon={<Layers size={18} />}
                                            label="My Collections"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <MenuLink
                                            to="/saved"
                                            icon={<Bookmark size={18} />}
                                            label="Saved Prompts"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <MenuLink
                                            to="/collections/saved"
                                            icon={<Layers size={18} />}
                                            label="Saved Collections"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="h-px bg-white/5 my-2 mx-2"></div>
                                        <MenuLink
                                            to="/user/$id"
                                            params={{ id: user?.id }}
                                            label="View Profile"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </SignedIn>

                    <SignedOut>
                        <div className="flex items-center gap-2">
                            <Link
                                to="/sign-in"
                                className="px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white transition"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/sign-up"
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                Join Now
                            </Link>
                        </div>
                    </SignedOut>
                </div>
            </div>
        </nav>
    );
}

// Sub-components for cleaner code
function NavLink({ to, icon, label }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:text-white hover:bg-white/5 transition-all group"
            activeProps={{ className: "text-blue-400 bg-blue-400/10" }}
        >
            <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                {icon}
            </span>
            {label}
        </Link>
    );
}

function MenuLink({ to, params, icon, label, onClick }) {
    return (
        <Link
            to={to}
            params={params}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
            {icon}
            {label}
        </Link>
    );
}
