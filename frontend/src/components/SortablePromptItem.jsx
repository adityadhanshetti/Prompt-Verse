// import { Link } from "@tanstack/react-router";
// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// export default function SortablePromptItem({ id, prompt, isOwner, onRemove }) {
//     const { attributes, listeners, setNodeRef, transform, transition } =
//         useSortable({ id });

//     const style = {
//         transform: CSS.Transform.toString(transform),
//         transition,
//     };

//     return (
//         <div
//             ref={setNodeRef}
//             style={style}
//             className="border border-gray-800 bg-gray-900 rounded-xl p-4 flex justify-between items-center"
//         >
//             <div>
//                 <Link
//                     to="/prompt/$id"
//                     params={{ id: prompt._id }}
//                     className="font-semibold hover:underline"
//                 >
//                     {prompt.title}
//                 </Link>

//                 <Link
//                     to="/category/$category"
//                     params={{ category: prompt.category }}
//                     className="text-blue-400 hover:underline"
//                 >
//                     {prompt.category}
//                 </Link>
//             </div>

//             <div className="flex gap-3 items-center">
//                 {isOwner && (
//                     <>
//                         <button
//                             onClick={onRemove}
//                             className="text-red-400 hover:text-red-300 text-sm"
//                         >
//                             Remove
//                         </button>

//                         <button
//                             {...attributes}
//                             {...listeners}
//                             className="cursor-grab bg-gray-800 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700"
//                         >
//                             Drag
//                         </button>
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// }

import { Link } from "@tanstack/react-router";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ExternalLink, Hash } from "lucide-react";

export default function SortablePromptItem({ id, prompt, isOwner, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                isDragging
                    ? "bg-blue-600/20 border-blue-500/50 shadow-2xl scale-[1.02] backdrop-blur-xl ring-1 ring-blue-500/50"
                    : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]"
            }`}
        >
            {/* 1. The Drag Handle - Explicitly styled */}
            {isOwner && (
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 text-slate-600 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
                >
                    <GripVertical size={20} />
                </button>
            )}

            {/* 2. Visual Preview (If you have thumbnails) */}
            <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                <Hash size={20} />
            </div>

            {/* 3. Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                    <Link
                        to="/prompt/$id"
                        params={{ id: prompt._id }}
                        className="text-base font-bold text-white hover:text-blue-400 transition-colors truncate"
                    >
                        {prompt.title}
                    </Link>

                    <Link
                        to="/category/$category"
                        params={{ category: prompt.category }}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-500/80 hover:text-blue-400 transition-colors"
                    >
                        {prompt.category}
                    </Link>
                </div>
            </div>

            {/* 4. Action Layer - Revealed on Hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                {isOwner && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onRemove();
                        }}
                        className="p-2.5 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        title="Remove"
                    >
                        <Trash2 size={18} />
                    </button>
                )}

                <Link
                    to="/prompt/$id"
                    params={{ id: prompt._id }}
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-white/10 hover:text-white transition-all"
                >
                    <ExternalLink size={18} />
                </Link>
            </div>
        </div>
    );
}