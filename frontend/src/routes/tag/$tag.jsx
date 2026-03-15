import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPromptsAdvanced } from "../../lib/promptApi.js";

export const Route = createFileRoute("/tag/$tag")({
    component: TagPage,
});

function TagPage() {
    const { tag } = Route.useParams();

    const {
        data: prompts = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["tagPrompts", tag],
        queryFn: () =>
            fetchPromptsAdvanced({
                tag,
                sort: "trending",
            }),
    });

    if (isLoading) return <p className="text-gray-400">Loading prompts...</p>;
    if (isError) return <p className="text-red-500">Failed to load prompts.</p>;

    return (
        <div className="max-w-5xl">
            <h1 className="text-3xl font-bold">#{tag}</h1>
            <p className="text-gray-400 mt-2">
                Trending prompts tagged with{" "}
                <span className="text-white">#{tag}</span>
            </p>

            <div className="mt-8 flex flex-col gap-4">
                {prompts.length === 0 ? (
                    <p className="text-gray-500">
                        No prompts found for this tag.
                    </p>
                ) : (
                    prompts.map((p) => (
                        <div
                            key={p._id}
                            className="border border-gray-800 bg-gray-900 rounded-xl p-4"
                        >
                            <Link
                                to="/prompt/$id"
                                params={{ id: p._id }}
                                className="text-lg font-semibold hover:underline"
                            >
                                {p.title}
                            </Link>

                            <p className="text-gray-400 text-sm mt-2">
                                Category:{" "}
                                <Link
                                    to="/category/$category"
                                    params={{ category: p.category }}
                                    className="text-blue-400 hover:underline"
                                >
                                    {p.category}
                                </Link>
                            </p>

                            {p.tags?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {p.tags.map((t, i) => (
                                        <Link
                                            key={i}
                                            to="/tag/$tag"
                                            params={{ tag: t }}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-gray-200"
                                        >
                                            #{t}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 flex gap-6 text-xs text-gray-500">
                                <p>Likes: {p.likesCount}</p>
                                <p>Forks: {p.forksCount}</p>
                                <p>Copies: {p.copiesCount}</p>
                                <p>Saves: {p.savesCount}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
