import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DiffViewer from "react-diff-viewer-continued";

import { fetchVersions, restoreVersion } from "../lib/promptApi.js";
import { SignedIn, useAuth } from "@clerk/clerk-react";

export default function VersionsSection({ prompt }) {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const [selectedVersion, setSelectedVersion] = useState(null);

    const {
        data: versions,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["versions", prompt._id],
        queryFn: () => fetchVersions(prompt._id),
    });

    const restoreMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return restoreVersion(prompt._id, selectedVersion._id, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["prompt", prompt._id]);
            queryClient.invalidateQueries(["versions", prompt._id]);
            alert("Version restored successfully!");
        },
    });

    if (isLoading) {
        return <p className="text-gray-400 mt-6">Loading versions...</p>;
    }

    if (isError) {
        return <p className="text-red-500 mt-6">Failed to load versions.</p>;
    }

    if (!versions || versions.length === 0) {
        return (
            <div className="mt-10">
                <h2 className="text-xl font-semibold">Versions</h2>
                <p className="text-gray-500 mt-2">No versions available yet.</p>
            </div>
        );
    }

    return (
        <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Version History</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Versions List */}
                <div className="border border-gray-800 bg-gray-900 rounded-xl p-3">
                    <h3 className="font-semibold mb-3">All Versions</h3>

                    <div className="flex flex-col gap-2">
                        {versions.map((v) => (
                            <button
                                key={v._id}
                                onClick={() => setSelectedVersion(v)}
                                className={`text-left p-3 rounded-lg border transition ${
                                    selectedVersion?._id === v._id
                                        ? "border-blue-500 bg-blue-900/30"
                                        : "border-gray-800 hover:bg-gray-800"
                                }`}
                            >
                                <p className="font-semibold text-sm">
                                    Version {v.versionNumber}
                                </p>

                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(v.createdAt).toLocaleString()}
                                </p>

                                {v.changeNote && (
                                    <p className="text-xs text-gray-300 mt-2">
                                        {v.changeNote}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Diff Viewer */}
                <div className="md:col-span-2 border border-gray-800 bg-gray-900 rounded-xl p-4">
                    {!selectedVersion ? (
                        <p className="text-gray-500">
                            Select a version to compare.
                        </p>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">
                                    Current vs Version{" "}
                                    {selectedVersion.versionNumber}
                                </h3>

                                <SignedIn>
                                    <button
                                        onClick={() => restoreMutation.mutate()}
                                        disabled={restoreMutation.isLoading}
                                        className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                                    >
                                        {restoreMutation.isLoading
                                            ? "Restoring..."
                                            : "Restore"}
                                    </button>
                                </SignedIn>
                            </div>

                            <DiffViewer
                                oldValue={selectedVersion.promptText}
                                newValue={prompt.promptText}
                                splitView={true}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
