import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

import {
    fetchMyCollections,
    addPromptToCollection,
} from "../lib/collectionApi.js";

export default function AddToCollection({ promptId }) {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);

    const { data: collections, isLoading } = useQuery({
        queryKey: ["myCollections"],
        queryFn: async () => {
            const token = await getToken();
            return fetchMyCollections(token);
        },
        enabled: open, // only fetch when modal opens
    });

    const addMutation = useMutation({
        mutationFn: async (collectionId) => {
            const token = await getToken();
            return addPromptToCollection(collectionId, promptId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["myCollections"]);
            alert("Added to collection!");
            setOpen(false);
        },
    });

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-medium"
            >
                Add to Collection
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-3 z-50">
                    <h3 className="font-semibold mb-2 text-sm">
                        Your Collections
                    </h3>

                    {isLoading ? (
                        <p className="text-gray-400 text-sm">Loading...</p>
                    ) : collections?.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                            No collections found.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {collections?.map((c) => (
                                <button
                                    key={c._id}
                                    onClick={() => addMutation.mutate(c._id)}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-sm"
                                >
                                    {c.title}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => setOpen(false)}
                        className="mt-3 w-full text-sm text-gray-400 hover:text-white"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
