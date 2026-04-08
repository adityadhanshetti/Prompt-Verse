// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// import { useAuth, useUser, SignedIn } from "@clerk/clerk-react";

// import { getUserByUserId } from "../../lib/userApi";

// import {
//     fetchCollectionById,
//     removePromptFromCollection,
//     reorderCollection,
// } from "../../lib/collectionApi.js";

// import { DndContext, closestCenter } from "@dnd-kit/core";

// import {
//     SortableContext,
//     verticalListSortingStrategy,
//     arrayMove,
// } from "@dnd-kit/sortable";

// import SortablePromptItem from "../../components/SortablePromptItem.jsx";

// export const Route = createFileRoute("/collections/$id")({
//     component: CollectionDetails,
// });

// function CollectionDetails() {
//     const { id } = Route.useParams();
//     const queryClient = useQueryClient();
//     const { getToken } = useAuth();
//     const { user } = useUser();

//     const {
//         data: collection,
//         isLoading,
//         isError,
//     } = useQuery({
//         queryKey: ["collection", id],
//         queryFn: () => fetchCollectionById(id),
//     });

//     const creatorId = collection?.createdByClerkId;

//     const { data: creator } = useQuery({
//         queryKey: ["user", creatorId],
//         queryFn: () => getUserByUserId(creatorId),
//         enabled: !!creatorId,
//     });

//     const removeMutation = useMutation({
//         mutationFn: async (promptId) => {
//             const token = await getToken();
//             return removePromptFromCollection(id, promptId, token);
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["collection", id] });
//         },
//     });

//     const reorderMutation = useMutation({
//         mutationFn: async (updatedPrompts) => {
//             const token = await getToken();
//             return reorderCollection(id, updatedPrompts, token);
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries(["collection", id]);
//         },
//     });

//     if (isLoading)
//         return <p className="text-gray-400">Loading collection...</p>;
//     if (isError) return <p className="text-red-500">Collection not found.</p>;

//     const isOwner = user?.id === collection.createdByClerkId;

//     const sortedPrompts = [...collection.prompts].sort(
//         (a, b) => a.order - b.order,
//     );

//     console.log(sortedPrompts);

//     const handleDragEnd = (event) => {
//         if (!isOwner) return;

//         const { active, over } = event;
//         if (!over || active.id === over.id) return;

//         const oldIndex = sortedPrompts.findIndex(
//             (p) => p.promptId._id === active.id,
//         );
//         const newIndex = sortedPrompts.findIndex(
//             (p) => p.promptId._id === over.id,
//         );

//         const newArray = arrayMove(sortedPrompts, oldIndex, newIndex);

//         const finalPrompts = newArray.map((p, index) => ({
//             promptId: p.promptId._id,
//             order: index,
//             addedAt: p.addedAt,
//         }));

//         reorderMutation.mutate(finalPrompts);
//     };

//     return (
//         <div>
//             <h1 className="text-3xl font-bold">{collection.title}</h1>

//             {/* Collection Creator */}
//             {creator && (
//                 <div className="mt-4 mb-2">
//                     <Link
//                         to="/user/$id"
//                         params={{ id: creatorId }}
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
//                     >
//                         {creator.avatar ? (
//                             <img
//                                 src={creator.avatar}
//                                 alt={creator.fullName}
//                                 className="w-5 h-5 rounded-full"
//                             />
//                         ) : (
//                             <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
//                                 {creator.fullName?.[0]?.toUpperCase() || "?"}
//                             </div>
//                         )}
//                         <span className="text-sm font-medium text-gray-200">
//                             {creator.fullName}
//                         </span>
//                         <span className="text-xs text-gray-500">
//                             @{creator.username}
//                         </span>
//                     </Link>
//                 </div>
//             )}

//             <p className="text-gray-400 mt-2">{collection.description}</p>

//             <p className="text-gray-500 text-sm mt-2">
//                 Visibility: {collection.visibility}
//             </p>

//             <div className="mt-8">
//                 {sortedPrompts.length === 0 ? (
//                     <p className="text-gray-500">No prompts added yet.</p>
//                 ) : (
//                     <DndContext
//                         collisionDetection={closestCenter}
//                         onDragEnd={handleDragEnd}
//                     >
//                         <SortableContext
//                             items={sortedPrompts.map((p) => p.promptId._id)}
//                             strategy={verticalListSortingStrategy}
//                         >
//                             <div className="flex flex-col gap-3">
//                                 {sortedPrompts.map((p) => (
//                                     <SortablePromptItem
//                                         key={p.promptId._id}
//                                         id={p.promptId._id}
//                                         prompt={p.promptId}
//                                         isOwner={isOwner}
//                                         onRemove={() =>
//                                             removeMutation.mutate(
//                                                 p.promptId._id,
//                                             )
//                                         }
//                                     />
//                                 ))}
//                             </div>
//                         </SortableContext>
//                     </DndContext>
//                 )}
//             </div>

//             <SignedIn>
//                 {isOwner && (
//                     <p className="text-xs text-gray-500 mt-4">
//                         Drag prompts to reorder them.
//                     </p>
//                 )}
//             </SignedIn>
//         </div>
//     );
// }

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser, SignedIn } from "@clerk/clerk-react";
import { getUserByUserId } from "../../lib/userApi";
import {
    fetchCollectionById,
    removePromptFromCollection,
    reorderCollection,
} from "../../lib/collectionApi.js";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
    Globe,
    Lock,
    GripVertical,
    Trash2,
    Layers,
    Calendar,
    User,
} from "lucide-react";

import SortablePromptItem from "../../components/SortablePromptItem.jsx";

export const Route = createFileRoute("/collections/$id")({
    component: CollectionDetails,
});

function CollectionDetails() {
    const { id } = Route.useParams();
    const queryClient = useQueryClient();
    const { getToken } = useAuth();
    const { user } = useUser();

    // Sensors for better touch/mobile support
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const {
        data: collection,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["collection", id],
        queryFn: () => fetchCollectionById(id),
    });

    // authorId is populated User object with clerkId
    const creatorClerkId = collection?.authorId?.clerkId;
    const creator = collection?.authorId;

    const removeMutation = useMutation({
        mutationFn: async (promptId) => {
            const token = await getToken();
            return removePromptFromCollection(id, promptId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collection", id] });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (updatedPrompts) => {
            const token = await getToken();
            return reorderCollection(id, updatedPrompts, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["collection", id]);
        },
    });

    if (isLoading)
        return (
            <div className="max-w-4xl mx-auto py-20 animate-pulse">
                <div className="h-10 bg-white/5 w-1/3 rounded-xl mb-4" />
                <div className="h-4 bg-white/5 w-1/2 rounded-lg" />
            </div>
        );

    if (isError)
        return (
            <div className="text-center py-20">
                <p className="text-red-400 font-bold">
                    Collection not found or has been deleted.
                </p>
            </div>
        );

    const isOwner = user?.id === collection.authorId?.clerkId;
    const sortedPrompts = [...collection.prompts].sort(
        (a, b) => a.order - b.order,
    );

    const handleDragEnd = (event) => {
        if (!isOwner) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = sortedPrompts.findIndex(
            (p) => p.promptId._id === active.id,
        );
        const newIndex = sortedPrompts.findIndex(
            (p) => p.promptId._id === over.id,
        );

        const newArray = arrayMove(sortedPrompts, oldIndex, newIndex);
        const finalPrompts = newArray.map((p, index) => ({
            promptId: p.promptId._id,
            order: index,
            addedAt: p.addedAt,
        }));

        reorderMutation.mutate(finalPrompts);
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            {/* Hero Section */}
            <div className="relative mb-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 via-transparent to-transparent border border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Layers size={120} />
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            collection.visibility === "public"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                        }`}
                    >
                        {collection.visibility === "public" ? (
                            <Globe size={12} />
                        ) : (
                            <Lock size={12} />
                        )}
                        {collection.visibility}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <Calendar size={12} />
                        Updated{" "}
                        {new Date(collection.updatedAt).toLocaleDateString()}
                    </span>
                </div>

                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                    {collection.title}
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-8">
                    {collection.description ||
                        "No description provided for this collection."}
                </p>

                {/* Creator Chip */}
                {creator && (
                    <Link
                        to="/user/$id"
                        params={{ id: creatorClerkId }}
                        className="group inline-flex items-center gap-3 p-2 pr-6 rounded-2xl bg-[#030712] border border-white/10 hover:border-blue-500/50 transition-all shadow-xl"
                    >
                        <div className="relative">
                            {creator.avatar ? (
                                <img
                                    src={creator.avatar}
                                    className="w-10 h-10 rounded-xl object-cover"
                                    alt=""
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
                                    {creator.fullName?.[0]}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#030712] rounded-full" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                Curated by
                            </p>
                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                {creator.fullName}{" "}
                                <span className="text-slate-500 font-medium ml-1">
                                    @{creator.username}
                                </span>
                            </p>
                        </div>
                    </Link>
                )}
            </div>

            {/* List Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Prompts{" "}
                        <span className="text-slate-500 font-normal">
                            ({sortedPrompts.length})
                        </span>
                    </h2>
                    {isOwner && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg">
                            Sorting Enabled
                        </p>
                    )}
                </div>

                {sortedPrompts.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                        <p className="text-slate-500 italic">
                            This collection is currently empty.
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sortedPrompts.map((p) => p.promptId._id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid gap-4">
                                {sortedPrompts.map((p) => (
                                    <SortablePromptItem
                                        key={p.promptId._id}
                                        id={p.promptId._id}
                                        prompt={p.promptId}
                                        isOwner={isOwner}
                                        onRemove={() =>
                                            removeMutation.mutate(
                                                p.promptId._id,
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {isOwner && sortedPrompts.length > 0 && (
                <div className="mt-12 flex items-center justify-center gap-2 text-slate-600">
                    <GripVertical size={14} />
                    <span className="text-xs font-medium">
                        Drag and drop prompts to reorder your gallery
                    </span>
                </div>
            )}
        </div>
    );
}
