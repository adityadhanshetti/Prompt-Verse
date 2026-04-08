import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DiffViewer from "react-diff-viewer-continued";
import { fetchVersions, restoreVersion } from "../lib/promptApi.js";
import { SignedIn, useAuth, useUser } from "@clerk/clerk-react";
import {
    History,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    FileText,
    User2,
    AlertTriangle,
    GitCommitHorizontal,
    Tag,
} from "lucide-react";

// Custom dark theme for diff viewer
const diffStyles = {
    variables: {
        dark: {
            diffViewerBackground: "#0a0a0a",
            diffViewerColor: "#c9d1d9",
            addedBackground: "rgba(46, 160, 67, 0.12)",
            addedColor: "#7ee787",
            removedBackground: "rgba(248, 81, 73, 0.12)",
            removedColor: "#ffa198",
            wordAddedBackground: "rgba(46, 160, 67, 0.3)",
            wordRemovedBackground: "rgba(248, 81, 73, 0.3)",
            addedGutterBackground: "rgba(46, 160, 67, 0.2)",
            removedGutterBackground: "rgba(248, 81, 73, 0.2)",
            gutterBackground: "#0d1117",
            gutterBackgroundDark: "#0a0a0a",
            highlightBackground: "rgba(56, 139, 253, 0.1)",
            highlightGutterBackground: "rgba(56, 139, 253, 0.15)",
            codeFoldGutterBackground: "#161b22",
            codeFoldBackground: "#161b22",
            emptyLineBackground: "#0d1117",
            gutterColor: "#484f58",
            addedGutterColor: "#7ee787",
            removedGutterColor: "#ffa198",
            codeFoldContentColor: "#8b949e",
            diffViewerTitleBackground: "#161b22",
            diffViewerTitleColor: "#c9d1d9",
            diffViewerTitleBorderColor: "#30363d",
        },
    },
    line: {
        padding: "4px 8px",
        fontSize: "13px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    },
    contentText: {
        fontSize: "13px",
        lineHeight: "1.6",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    },
};

export default function VersionsSection({ prompt }) {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();
    const { user } = useUser();

    const [selectedVersion, setSelectedVersion] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [showConfirmRestore, setShowConfirmRestore] = useState(false);
    const [diffTab, setDiffTab] = useState("text"); // "text" | "title" | "meta"

    const isOwner = user?.id === prompt.authorId?.clerkId;

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["versions", prompt._id],
        queryFn: () => fetchVersions(prompt._id),
    });

    const versions = data?.versions ?? (Array.isArray(data) ? data : []);
    const totalVersions = data?.totalVersions ?? versions.length;

    const restoreMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return restoreVersion(prompt._id, selectedVersion._id, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["prompt", prompt._id]);
            queryClient.invalidateQueries(["versions", prompt._id]);
            setShowConfirmRestore(false);
            setSelectedVersion(null);
        },
    });

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

    const getChangeSummary = (version) => {
        const changes = [];
        if (version.title !== prompt.title) changes.push("title");
        if (version.promptText !== prompt.promptText) changes.push("content");
        if (JSON.stringify(version.tags) !== JSON.stringify(prompt.tags))
            changes.push("tags");
        if (version.category !== prompt.category) changes.push("category");
        if (version.visibility !== prompt.visibility)
            changes.push("visibility");
        return changes;
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <History size={14} className="text-blue-400" />
                    </div>
                    <div className="h-5 w-32 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-16 bg-white/2 border border-white/5 rounded-2xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="size-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <History size={14} className="text-red-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Version History</h2>
                </div>
                <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 text-center">
                    <p className="text-sm text-red-400">Failed to load version history.</p>
                </div>
            </div>
        );
    }

    if (!versions || versions.length === 0) {
        return (
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <History size={14} className="text-blue-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Version History</h2>
                </div>
                <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center">
                    <div className="size-12 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex items-center justify-center mx-auto mb-3">
                        <GitCommitHorizontal size={20} className="text-blue-500/40" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">No versions yet</p>
                    <p className="text-xs text-slate-600 mt-1">
                        Edits to this prompt will create version snapshots automatically
                    </p>
                </div>
            </div>
        );
    }

    const PREVIEW_COUNT = 5;
    const displayedVersions = expanded ? versions : versions.slice(0, PREVIEW_COUNT);
    const hasMore = versions.length > PREVIEW_COUNT;

    return (
        <div className="mt-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <History size={14} className="text-blue-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Version History</h2>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                        {totalVersions}
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 via-blue-500/10 to-transparent pointer-events-none" />

                <div className="space-y-1">
                    {displayedVersions.map((v, index) => {
                        const isSelected = selectedVersion?._id === v._id;
                        const changes = getChangeSummary(v);

                        return (
                            <div key={v._id}
                                style={{
                                    animation: `versionCardIn 0.3s ease-out ${index * 0.04}s both`,
                                }}
                            >
                                <button
                                    onClick={() =>
                                        setSelectedVersion(isSelected ? null : v)
                                    }
                                    className={`w-full text-left pl-10 pr-4 py-3.5 rounded-xl relative transition-all duration-200 cursor-pointer group ${
                                        isSelected
                                            ? "bg-blue-500/8 border border-blue-500/20"
                                            : "hover:bg-white/3 border border-transparent"
                                    }`}
                                >
                                    {/* Timeline dot */}
                                    <div
                                        className={`absolute left-[10px] top-1/2 -translate-y-1/2 size-[11px] rounded-full border-2 transition-all ${
                                            isSelected
                                                ? "bg-blue-500 border-blue-400 shadow-md shadow-blue-500/30"
                                                : "bg-[#0a0a0a] border-white/20 group-hover:border-blue-400/50"
                                        }`}
                                    />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-sm font-bold text-white whitespace-nowrap">
                                                v{v.versionNumber}
                                            </span>
                                            {v.changeNote && (
                                                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                                                    — {v.changeNote}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* Change pills */}
                                            {changes.length > 0 && (
                                                <div className="hidden md:flex items-center gap-1">
                                                    {changes.slice(0, 2).map((c) => (
                                                        <span
                                                            key={c}
                                                            className="text-[9px] uppercase tracking-wider font-bold bg-white/5 text-slate-500 border border-white/5 px-1.5 py-0.5 rounded"
                                                        >
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {changes.length > 2 && (
                                                        <span className="text-[9px] text-slate-600">
                                                            +{changes.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Author */}
                                            {v.editedBy?.username && (
                                                <span className="text-[11px] text-slate-500 hidden sm:inline">
                                                    @{v.editedBy.username}
                                                </span>
                                            )}

                                            {/* Time */}
                                            <span className="text-[11px] text-slate-600 whitespace-nowrap">
                                                {timeAgo(v.createdAt)}
                                            </span>

                                            <ChevronRight
                                                size={14}
                                                className={`text-slate-600 transition-transform duration-200 ${
                                                    isSelected ? "rotate-90 text-blue-400" : ""
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Title change preview in timeline row */}
                                    {v.title !== prompt.title && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-400/60">
                                            <FileText size={10} />
                                            <span className="line-through opacity-50">{v.title}</span>
                                            <span>→</span>
                                            <span>{prompt.title}</span>
                                        </div>
                                    )}
                                </button>

                                {/* Expanded diff panel */}
                                {isSelected && (
                                    <div
                                        className="ml-10 mt-1 mb-3 rounded-2xl border border-white/8 bg-[#080808] overflow-hidden"
                                        style={{
                                            animation: "versionPanelExpand 0.25s ease-out",
                                        }}
                                    >
                                        {/* Diff header with tabs */}
                                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/2">
                                            <div className="flex items-center gap-1">
                                                {[
                                                    { key: "text", label: "Content", icon: FileText },
                                                    { key: "meta", label: "Metadata", icon: Tag },
                                                ].map(({ key, label, icon: Icon }) => (
                                                    <button
                                                        key={key}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDiffTab(key);
                                                        }}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                            diffTab === key
                                                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                                                : "text-slate-500 hover:text-slate-300 border border-transparent"
                                                        }`}
                                                    >
                                                        <Icon size={11} />
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <SignedIn>
                                                    {isOwner && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowConfirmRestore(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
                                                        >
                                                            <RotateCcw size={11} />
                                                            Restore
                                                        </button>
                                                    )}
                                                </SignedIn>
                                            </div>
                                        </div>

                                        {/* Diff content */}
                                        <div className="max-h-[400px] overflow-auto">
                                            {diffTab === "text" && (
                                                <DiffViewer
                                                    oldValue={v.promptText}
                                                    newValue={prompt.promptText}
                                                    splitView={false}
                                                    useDarkTheme={true}
                                                    styles={diffStyles}
                                                    leftTitle={`v${v.versionNumber}`}
                                                    rightTitle="Current"
                                                    hideLineNumbers={false}
                                                />
                                            )}

                                            {diffTab === "meta" && (
                                                <div className="p-5 space-y-4">
                                                    <MetaDiffRow
                                                        label="Title"
                                                        old={v.title}
                                                        current={prompt.title}
                                                    />
                                                    <MetaDiffRow
                                                        label="Category"
                                                        old={v.category}
                                                        current={prompt.category}
                                                    />
                                                    <MetaDiffRow
                                                        label="Tags"
                                                        old={v.tags?.join(", ") || "—"}
                                                        current={prompt.tags?.join(", ") || "—"}
                                                    />
                                                    <MetaDiffRow
                                                        label="Visibility"
                                                        old={v.visibility}
                                                        current={prompt.visibility}
                                                    />
                                                    <MetaDiffRow
                                                        label="Template"
                                                        old={v.isTemplate ? "Yes" : "No"}
                                                        current={prompt.isTemplate ? "Yes" : "No"}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Version metadata footer */}
                                        <div className="px-5 py-2.5 border-t border-white/5 bg-white/2 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-600">
                                                Snapshot saved on{" "}
                                                {new Date(v.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                            {v.editedBy?.username && (
                                                <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                                    <User2 size={9} />
                                                    by @{v.editedBy.username}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Show more / less */}
            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-3 py-2.5 rounded-xl bg-white/2 border border-white/5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 hover:border-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    {expanded ? (
                        <>
                            <ChevronUp size={14} /> Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown size={14} /> Show {versions.length - PREVIEW_COUNT}{" "}
                            older version{versions.length - PREVIEW_COUNT > 1 ? "s" : ""}
                        </>
                    )}
                </button>
            )}

            {/* Restore Confirmation Modal */}
            {showConfirmRestore && selectedVersion && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                    style={{
                        background: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(12px)",
                        animation: "versionModalIn 0.2s ease-out",
                    }}
                    onClick={() => setShowConfirmRestore(false)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6"
                        style={{
                            animation: "versionModalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                            boxShadow: "0 25px 80px -12px rgba(245, 158, 11, 0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle size={18} className="text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Restore Version?</h3>
                                <p className="text-xs text-slate-500">
                                    This action will save the current state as a new version
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 mb-5">
                            <p className="text-sm text-amber-300/80">
                                Restoring to <span className="font-bold text-amber-300">v{selectedVersion.versionNumber}</span> will
                                replace the current prompt content. The current state will be
                                automatically saved as a new version before restoring.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmRestore(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => restoreMutation.mutate()}
                                disabled={restoreMutation.isPending}
                                className="px-5 py-2 rounded-xl bg-amber-500 text-sm font-bold text-black flex items-center gap-2 hover:bg-amber-400 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                {restoreMutation.isPending ? "Restoring..." : "Restore"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes versionCardIn {
                    from {
                        opacity: 0;
                        transform: translateX(-6px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes versionPanelExpand {
                    from {
                        opacity: 0;
                        transform: translateY(-6px);
                        max-height: 0;
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                        max-height: 600px;
                    }
                }
                @keyframes versionModalIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes versionModalSlide {
                    from {
                        opacity: 0;
                        transform: translateY(16px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

// Helper component for metadata diff comparison
function MetaDiffRow({ label, old, current }) {
    const hasChanged = old !== current;
    return (
        <div className="flex items-start gap-4">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600 w-20 shrink-0 pt-0.5">
                {label}
            </span>
            <div className="flex-1 min-w-0">
                {hasChanged ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-red-500/50 w-6">OLD</span>
                            <span className="text-sm text-red-400/70 line-through truncate">{old}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500/50 w-6">NEW</span>
                            <span className="text-sm text-emerald-400 truncate">{current}</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-sm text-slate-500">{current}</span>
                )}
            </div>
            {hasChanged && (
                <span className="text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                    Changed
                </span>
            )}
        </div>
    );
}
