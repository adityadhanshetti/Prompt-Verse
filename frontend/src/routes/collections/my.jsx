// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useQuery } from "@tanstack/react-query";
// import {
//     SignedIn,
//     SignedOut,
//     RedirectToSignIn,
//     useAuth,
// } from "@clerk/clerk-react";

// import { fetchMyCollections } from "../../lib/collectionApi.js";

// export const Route = createFileRoute("/collections/my")({
//     component: MyCollectionsPage,
// });

// function MyCollectionsPage() {
//     return (
//         <>
//             <SignedIn>
//                 <MyCollectionsContent />
//             </SignedIn>

//             <SignedOut>
//                 <RedirectToSignIn />
//             </SignedOut>
//         </>
//     );
// }

// function MyCollectionsContent() {
//     const { getToken } = useAuth();

//     const {
//         data: collections,
//         isLoading,
//         isError,
//     } = useQuery({
//         queryKey: ["myCollectionsPage"],
//         queryFn: async () => {
//             const token = await getToken();
//             return fetchMyCollections(token);
//         },
//     });

//     if (isLoading)
//         return <p className="text-gray-400">Loading collections...</p>;
//     if (isError)
//         return <p className="text-red-500">Failed to load collections.</p>;

//     return (
//         <div className="max-w-4xl">
//             <h1 className="text-3xl font-bold">My Collections</h1>
//             <p className="text-gray-400 mt-2">Your created prompt packs.</p>

//             <div className="mt-8 flex flex-col gap-4">
//                 {collections.length === 0 ? (
//                     <p className="text-gray-500">No collections yet.</p>
//                 ) : (
//                     collections.map((c) => (
//                         <div
//                             key={c._id}
//                             className="border border-gray-800 bg-gray-900 rounded-xl p-4"
//                         >
//                             <Link
//                                 to="/collections/$id"
//                                 params={{ id: c._id }}
//                                 className="text-lg font-semibold hover:underline"
//                             >
//                                 {c.title}
//                             </Link>

//                             <p className="text-gray-400 text-sm mt-2">
//                                 {c.description}
//                             </p>

//                             <p className="text-xs text-gray-500 mt-2">
//                                 Visibility: {c.visibility}
//                             </p>
//                         </div>
//                     ))
//                 )}
//             </div>
//         </div>
//     );
// }

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    SignedIn,
    SignedOut,
    RedirectToSignIn,
    useAuth,
} from "@clerk/clerk-react";
import { fetchMyCollections } from "../../lib/collectionApi.js";
import {
    Plus,
    Layers,
    Globe,
    Lock,
    ChevronRight,
    ArrowRight,
    Loader2,
} from "lucide-react";

export const Route = createFileRoute("/collections/my")({
    component: MyCollectionsPage,
});

function MyCollectionsPage() {
    return (
        <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-12">
            <SignedIn>
                <MyCollectionsContent />
            </SignedIn>

            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function MyCollectionsContent() {
    const { getToken } = useAuth();

    const {
        data: collections,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["myCollectionsPage"],
        queryFn: async () => {
            const token = await getToken();
            return fetchMyCollections(token);
        },
    });

    if (isLoading)
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-slate-500 font-medium animate-pulse">
                    Loading your library...
                </p>
            </div>
        );

    if (isError)
        return (
            <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20 text-center">
                <p className="text-red-400 font-bold">
                    Failed to load collections.
                </p>
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        My Collections
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage and curate your custom prompt packs.
                    </p>
                </div>

                <Link
                    to="/collections/create"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 w-fit"
                >
                    <Plus size={20} />
                    <span>Create New Collection</span>
                </Link>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. The "Empty State" Add Card (Always visible if list is small) */}
                {collections.length < 6 && (
                    <Link
                        to="/collections/create"
                        className="group border-2 border-dashed border-white/5 hover:border-blue-500/40 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 transition-all hover:bg-blue-500/[0.02]"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Plus size={24} />
                        </div>
                        <p className="font-bold text-slate-500 group-hover:text-blue-400 transition-colors">
                            New Collection
                        </p>
                    </Link>
                )}

                {/* 2. Collection Cards */}
                {collections.map((c) => (
                    <Link
                        key={c._id}
                        to="/collections/$id"
                        params={{ id: c._id }}
                        className="group relative bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-[2.5rem] p-8 transition-all hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-black"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Layers size={24} />
                            </div>
                            <span
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    c.visibility === "public"
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                }`}
                            >
                                {c.visibility === "public" ? (
                                    <Globe size={12} />
                                ) : (
                                    <Lock size={12} />
                                )}
                                {c.visibility}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                            {c.title}
                        </h3>

                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-6">
                            {c.description || "No description provided."}
                        </p>

                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                {c.prompts?.length || 0} Prompts
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-white/10 group-hover:text-white transition-all">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}