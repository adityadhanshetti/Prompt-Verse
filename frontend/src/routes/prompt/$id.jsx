// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { Outlet } from "@tanstack/react-router";


// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";

// import ForksSection from "../../components/ForksSection.jsx";
// import TemplatePromptBox from "../../components/TemplatePromptBox.jsx";
// import VersionsSection from "../../components/VersionsSection.jsx";

// import {
//     fetchPromptById,
//     incrementCopyCount,
//     forkPrompt,
// } from "../../lib/promptApi.js";

// export const Route = createFileRoute("/prompt/$id")({
//     component: PromptDetails,
// });

// function PromptDetails() {
//     const { id } = Route.useParams();
//     const queryClient = useQueryClient();
//     const { getToken } = useAuth();
//     const { user } = useUser();

//     const {
//         data: prompt,
//         isLoading,
//         isError,
//     } = useQuery({
//         queryKey: ["prompt", id],
//         queryFn: () => fetchPromptById(id),
//     });

//     const copyMutation = useMutation({
//         mutationFn: () => incrementCopyCount(id),
//         onSuccess: () => {
//             queryClient.invalidateQueries(["prompt", id]);
//             queryClient.invalidateQueries(["prompts"]);
//         },
//     });

//     const forkMutation = useMutation({
//         mutationFn: async () => {
//             const token = await getToken();
//             return forkPrompt(id, token);
//         },
//         onSuccess: (newPrompt) => {
//             queryClient.invalidateQueries(["prompt", id]);
//             queryClient.invalidateQueries(["prompts"]);
//             queryClient.invalidateQueries(["forks", id]);

//             // redirect user to forked prompt
//             window.location.href = `/prompt/${newPrompt._id}`;
//         },
//     });

//     const handleCopy = async () => {
//         if (!prompt) return;

//         await navigator.clipboard.writeText(prompt.promptText);
//         copyMutation.mutate();
//     };

//     if (isLoading) return <p className="text-gray-400">Loading prompt...</p>;
//     if (isError) return <p className="text-red-500">Prompt not found.</p>;

//     const isOwner = user?.id === prompt.createdByClerkId;

//     return (
//         <div className="max-w-4xl">
//             {/* Header */}
//             <div className="flex justify-between items-start gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold">{prompt.title}</h1>
//                     <p className="text-gray-400 mt-2">
//                         Category:{" "}
//                         <span className="text-white">{prompt.category}</span>
//                     </p>
//                 </div>

//                 {/* Buttons */}
//                 <div className="flex gap-4 items-center flex-wrap justify-end">
//                     <button
//                         onClick={handleCopy}
//                         className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium"
//                     >
//                         Copy Prompt
//                     </button>

//                     <SignedIn>
//                         <button
//                             onClick={() => forkMutation.mutate()}
//                             disabled={forkMutation.isLoading}
//                             className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
//                         >
//                             {forkMutation.isLoading
//                                 ? "Forking..."
//                                 : "Fork Prompt"}
//                         </button>
//                     </SignedIn>

//                     <SignedIn>
//                         {isOwner && (
//                             <Link
//                                 to="/prompt/$id/edit"
//                                 params={{ id }}
//                                 className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium"
//                             >
//                                 Edit
//                             </Link>
//                         )}
//                     </SignedIn>

//                     <SignedOut>
//                         <Link
//                             to="/sign-in"
//                             className="text-gray-400 hover:text-white text-sm underline"
//                         >
//                             Sign in to fork
//                         </Link>
//                     </SignedOut>
//                 </div>
//             </div>

//             {/* Forked From Banner */}
//             {prompt.forkedFrom && (
//                 <div className="mt-4 border border-purple-700 bg-purple-900/30 rounded-xl p-3">
//                     <p className="text-sm text-purple-200">
//                         Forked from{" "}
//                         <Link
//                             to="/prompt/$id"
//                             params={{ id: prompt.forkedFrom._id }}
//                             className="font-semibold underline"
//                         >
//                             {prompt.forkedFrom.title}
//                         </Link>
//                     </p>
//                 </div>
//             )}

//             {/* Tags */}
//             {prompt.tags?.length > 0 && (
//                 <div className="flex gap-2 flex-wrap mt-4">
//                     {prompt.tags.map((tag, i) => (
//                         <span
//                             key={i}
//                             className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-200"
//                         >
//                             #{tag}
//                         </span>
//                     ))}
//                 </div>
//             )}

//             {/* Prompt Markdown */}
//             <div className="mt-6 p-4 border border-gray-800 rounded-xl bg-gray-900">
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                     {prompt.promptText}
//                 </ReactMarkdown>
//             </div>

//             {/* Template Generator */}
//             {prompt.isTemplate && <TemplatePromptBox prompt={prompt} />}

//             {/* Stats */}
//             <div className="mt-6 flex gap-6 text-sm text-gray-400 flex-wrap">
//                 <p>Copies: {prompt.copiesCount}</p>
//                 <p>Likes: {prompt.likesCount}</p>
//                 <p>Forks: {prompt.forksCount}</p>
//                 <p>Saves: {prompt.savesCount}</p>
//             </div>

//             {/* Forks Section */}
//             <ForksSection promptId={id} />

//             {/* Versions Section */}
//             <VersionsSection prompt={prompt} />

//             <Outlet />
//         </div>
//     );
// }

import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/prompt/$id")({
    component: () => <Outlet />,
});
