import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
    useAuth,
    useUser,
    SignedIn,
    SignedOut,
    RedirectToSignIn,
} from "@clerk/clerk-react";

import { fetchPromptById, updatePrompt } from "../../../lib/promptApi.js";

export const Route = createFileRoute("/prompt/$id/edit")({
    component: EditPromptPage,
});

function EditPromptPage() {
    return (
        <>
            <SignedIn>
                <EditPromptForm />
            </SignedIn>

            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    );
}

function EditPromptForm() {
    const { id } = Route.useParams();
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();

    const queryClient = useQueryClient();

    const {
        data: prompt,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["prompt", id],
        queryFn: () => fetchPromptById(id),
    });

    const [title, setTitle] = useState("");
    const [promptText, setPromptText] = useState("");
    const [tags, setTags] = useState("");
    const [category, setCategory] = useState("general");
    const [changeNote, setChangeNote] = useState("");

    useEffect(() => {
        if (prompt) {
            setTitle(prompt.title);
            setPromptText(prompt.promptText);
            setTags(prompt.tags?.join(", ") || "");
            setCategory(prompt.category || "general");
        }
    }, [prompt]);

    const mutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();

            if (!token) {
                throw new Error("Token missing. Please login again.");
            }

            return updatePrompt(
                id,
                {
                    title,
                    promptText,
                    tags: tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    category,
                    changeNote,
                },
                token,
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["prompt", id]);
            queryClient.invalidateQueries(["prompts"]);
            queryClient.invalidateQueries(["versions", id]);

            window.location.href = `/prompt/${id}`;
        },
    });

    if (!isLoaded) return <p className="text-gray-400">Loading user...</p>;

    if (isLoading) return <p className="text-gray-400">Loading prompt...</p>;
    if (isError) return <p className="text-red-500">Prompt not found.</p>;

    if (!user) return <p className="text-red-500">User not found.</p>;

    // only creator can edit
    if (prompt.createdByClerkId !== user.id) {
        return (
            <div className="mt-6">
                <h1 className="text-xl font-bold text-red-500">
                    Access Denied
                </h1>
                <p className="text-gray-400 mt-2">
                    You are not allowed to edit this prompt.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <h1 className="text-3xl font-bold">Edit Prompt</h1>
            <p className="text-gray-400 mt-2">
                Updating this prompt will create a new version automatically.
            </p>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    mutation.mutate();
                }}
                className="mt-6 flex flex-col gap-4"
            >
                {/* Title */}
                <div>
                    <label className="text-sm text-gray-300 font-medium">
                        Title
                    </label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    />
                </div>

                {/* Prompt Text */}
                <div>
                    <label className="text-sm text-gray-300 font-medium">
                        Prompt Text
                    </label>
                    <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        rows={8}
                        className="mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="text-sm text-gray-300 font-medium">
                        Tags
                    </label>
                    <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="system, chatgpt, image"
                        className="mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="text-sm text-gray-300 font-medium">
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    >
                        <option value="general">General</option>
                        <option value="system">System</option>
                        <option value="coding">Coding</option>
                        <option value="marketing">Marketing</option>
                        <option value="image">Image</option>
                        <option value="business">Business</option>
                        <option value="writing">Writing</option>
                    </select>
                </div>

                {/* Change Note */}
                <div>
                    <label className="text-sm text-gray-300 font-medium">
                        Change Note (optional)
                    </label>
                    <input
                        value={changeNote}
                        onChange={(e) => setChangeNote(e.target.value)}
                        placeholder="Example: Improved structure"
                        className="mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    />
                </div>

                {/* Save */}
                <button
                    disabled={mutation.isLoading}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                    {mutation.isLoading ? "Saving..." : "Save Changes"}
                </button>

                {mutation.isError && (
                    <p className="text-red-500 text-sm">
                        Error: {mutation.error.message}
                    </p>
                )}
            </form>
        </div>
    );
}
