// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import {
//     useAuth,
//     SignedIn,
//     SignedOut,
//     RedirectToSignIn,
// } from "@clerk/clerk-react";
// import { useMutation } from "@tanstack/react-query";
// import { createCollection } from "../../lib/collectionApi";

// export const Route = createFileRoute("/collections/create")({
//     component: CreateCollectionPage,
// });

// function CreateCollectionPage() {
//     return (
//         <>
//             <SignedIn>
//                 <CreateCollectionForm />
//             </SignedIn>

//             <SignedOut>
//                 <RedirectToSignIn />
//             </SignedOut>
//         </>
//     );
// }

// function CreateCollectionForm() {
//     const { getToken } = useAuth();

//     const [title, setTitle] = useState("");
//     const [description, setDescription] = useState("");
//     const [visibility, setVisibility] = useState("public");

//     const mutation = useMutation({
//         mutationFn: async () => {
//             const token = await getToken();

//             return createCollection({ title, description, visibility }, token);
//         },
//         onSuccess: (collection) => {
//             alert("Collection created!");
//             window.location.href = `/collections/${collection._id}`;
//         },
//     });

//     return (
//         <div className="max-w-2xl">
//             <h1 className="text-3xl font-bold">Create Collection</h1>
//             <p className="text-gray-400 mt-2">Build your own prompt pack.</p>

//             <form
//                 onSubmit={(e) => {
//                     e.preventDefault();
//                     mutation.mutate();
//                 }}
//                 className="mt-6 flex flex-col gap-4"
//             >
//                 <input
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     placeholder="Collection Title"
//                     className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg"
//                 />

//                 <textarea
//                     value={description}
//                     onChange={(e) => setDescription(e.target.value)}
//                     placeholder="Collection description..."
//                     rows={4}
//                     className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg"
//                 />

//                 <select
//                     value={visibility}
//                     onChange={(e) => setVisibility(e.target.value)}
//                     className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg"
//                 >
//                     <option value="public">Public</option>
//                     <option value="private">Private</option>
//                     <option value="unlisted">Unlisted</option>
//                 </select>

//                 <button className="bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg font-semibold">
//                     Create Collection
//                 </button>
//             </form>
//         </div>
//     );
// }

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
    useAuth,
    SignedIn,
    SignedOut,
    RedirectToSignIn,
} from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { createCollection } from "../../lib/collectionApi.js";
import {
    Layers,
    Globe,
    Lock,
    EyeOff,
    Sparkles,
    ArrowRight,
    Loader2,
} from "lucide-react";

export const Route = createFileRoute("/collections/create")({
    component: CreateCollectionPage,
});

function CreateCollectionPage() {
    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#030712] flex items-center justify-center p-6">
            <SignedIn>
                <CreateCollectionForm />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </div>
    );
}

function CreateCollectionForm() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState("public");

    const mutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return createCollection({ title, description, visibility }, token);
        },
        onSuccess: (collection) => {
            // Using navigate() instead of window.location for a SPA feel
            navigate({ to: `/collections/${collection._id}` });
        },
    });

    const visibilityOptions = [
        {
            id: "public",
            label: "Public",
            desc: "Everyone can see and follow",
            icon: <Globe size={18} />,
        },
        {
            id: "private",
            label: "Private",
            desc: "Only you can access this",
            icon: <Lock size={18} />,
        },
    ];

    return (
        <div className="w-full max-w-xl bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400">
                    <Layers size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        New Collection
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Organize your favorite prompts into packs.
                    </p>
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    mutation.mutate();
                }}
                className="flex flex-col gap-6"
            >
                {/* Title Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-widest">
                        Title
                    </label>
                    <input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Midjourney Masterpieces"
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 px-5 py-4 rounded-2xl text-white outline-none transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end ml-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Description
                        </label>
                        <span
                            className={`text-[10px] ${description.length > 200 ? "text-red-400" : "text-slate-600"}`}
                        >
                            {description.length}/200
                        </span>
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this collection about?"
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 px-5 py-4 rounded-2xl text-white outline-none transition-all resize-none placeholder:text-slate-600"
                    />
                </div>

                {/* Visibility Selector (Modern Cards instead of Select) */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-widest">
                        Visibility
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        {visibilityOptions.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setVisibility(opt.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                                    visibility === opt.id
                                        ? "bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50"
                                        : "bg-white/5 border-white/5 hover:border-white/10"
                                }`}
                            >
                                <div
                                    className={`${visibility === opt.id ? "text-blue-400" : "text-slate-500"}`}
                                >
                                    {opt.icon}
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-bold ${visibility === opt.id ? "text-white" : "text-slate-300"}`}
                                    >
                                        {opt.label}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {opt.desc}
                                    </p>
                                </div>
                                {visibility === opt.id && (
                                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    disabled={mutation.isPending || !title}
                    className="group relative mt-4 w-full bg-blue-600 disabled:bg-slate-800 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold transition-all overflow-hidden active:scale-[0.98]"
                >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                        {mutation.isPending ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>Create Collection</span>
                                <ArrowRight
                                    size={18}
                                    className="group-hover:translate-x-1 transition-transform"
                                />
                            </>
                        )}
                    </div>
                    {/* Glossy overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </button>
            </form>
        </div>
    );
}