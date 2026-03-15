import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
    Folder,
    Heart,
    Layers,
    Utensils,
    Copy,
    Check,
    ChevronRight,
} from "lucide-react";

export default function PromptCard({ prompt }) {
    const [copied, setCopied] = useState(false);
    const promptCreatorId = prompt.createdByClerkId;

    const { fullName, username } = prompt.createdByMongoDBObjectId;

    const handleCopy = async (e) => {
        e.preventDefault(); // Prevent navigation if button is inside a Link
        await navigator.clipboard.writeText(prompt.promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative bg-[#0f1117] border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-blue-500/50 hover:bg-[#161922] hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]">
            {/* Top Row: User Info & Actions */}
            <div className="flex items-center justify-between mb-5">
                <Link
                    to="/user/$id"
                    params={{ id: promptCreatorId }}
                    className="flex items-center gap-3 group/author"
                >
                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-purple-500 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/5 group-hover/author:ring-blue-500/30 transition-all">
                        {fullName[0]}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-100 leading-none group-hover/author:text-blue-400 transition-colors">
                            {fullName}
                        </h4>
                        <span className="text-xs text-gray-500 group-hover/author:text-blue-400/70 transition-colors">
                            @{username}
                        </span>
                    </div>
                </Link>

                {/* <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                        copied
                            ? "bg-green-500/10 border-green-500/50 text-green-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button> */}
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

            {/* Footer Stats */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <StatItem
                        icon={<Layers size={14} />}
                        count={prompt.copiesCount}
                        label="Used"
                    />
                    <StatItem
                        icon={<Heart size={14} />}
                        count={prompt.likesCount}
                        label="Likes"
                    />
                </div>

                <div className="flex items-center gap-1.5 text-gray-500">
                    <Utensils size={14} />
                    <span className="text-xs font-medium">
                        {prompt.forksCount}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Helper component for cleaner stats
function StatItem({ icon, count, label }) {
    return (
        <div className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors cursor-default">
            {icon}
            <span className="text-xs font-semibold">{count}</span>
        </div>
    );
}
