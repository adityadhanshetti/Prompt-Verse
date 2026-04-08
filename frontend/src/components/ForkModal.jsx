import { useState, useEffect, useRef } from "react";
import { X, Utensils, Sparkles, AlertCircle, Type, FileText, Tag, FolderOpen } from "lucide-react";

export default function ForkModal({ prompt, onFork, onClose, isPending }) {
    const [title, setTitle] = useState(`${prompt.title} (Fork)`);
    const [promptText, setPromptText] = useState(prompt.promptText);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const overlayRef = useRef(null);
    const titleInputRef = useRef(null);

    useEffect(() => {
        titleInputRef.current?.focus();
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onFork({
            title: title.trim(),
            promptText: promptText.trim(),
        });
    };

    const charDiff = promptText.length - prompt.promptText.length;

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(12px)",
                animation: "forkModalOverlayIn 0.2s ease-out",
            }}
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0a0a0a]"
                style={{
                    animation: "forkModalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow:
                        "0 0 0 1px rgba(255,255,255,0.05), 0 25px 80px -12px rgba(139, 92, 246, 0.25), 0 0 60px -20px rgba(139, 92, 246, 0.15)",
                }}
            >
                {/* Glow accent */}
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Utensils size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Fork Prompt</h2>
                            <p className="text-xs text-slate-500">
                                Create your own version of this prompt
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X size={16} className="text-slate-400" />
                    </button>
                </div>

                {/* Origin badge */}
                <div className="mx-8 mb-6 flex items-center gap-2 bg-purple-500/5 border border-purple-500/15 rounded-xl px-4 py-2.5">
                    <Sparkles size={14} className="text-purple-400 shrink-0" />
                    <p className="text-xs text-purple-300/80 truncate">
                        Forking from{" "}
                        <span className="font-semibold text-purple-300">{prompt.title}</span>
                        {prompt.authorId?.username && (
                            <>
                                {" by "}
                                <span className="font-semibold text-purple-300">
                                    @{prompt.authorId.username}
                                </span>
                            </>
                        )}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div className="px-8 mb-5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            <Type size={12} />
                            Title
                        </label>
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                            placeholder="Your fork's title..."
                            required
                        />
                    </div>

                    {/* Prompt text editor */}
                    <div className="px-8 mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <FileText size={12} />
                                Prompt Text
                            </label>
                            {charDiff !== 0 && (
                                <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                        charDiff > 0
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    }`}
                                >
                                    {charDiff > 0 ? "+" : ""}
                                    {charDiff} chars
                                </span>
                            )}
                        </div>
                        <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            rows={8}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm font-mono leading-relaxed resize-y min-h-[120px]"
                            placeholder="Modify the prompt text..."
                        />
                    </div>

                    {/* Info callout */}
                    <div className="mx-8 mb-6 flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
                        <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300/70 leading-relaxed">
                            Your fork will be a completely independent prompt. You can edit the
                            title and content, and it will link back to the original.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-8 pb-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !title.trim()}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-sm font-bold text-white flex items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-purple-600/20"
                        >
                            <Utensils size={14} />
                            {isPending ? "Forking..." : "Create Fork"}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes forkModalOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes forkModalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.97);
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
