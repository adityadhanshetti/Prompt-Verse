import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPromptsAdvanced } from "../../lib/promptApi.js";

export const Route = createFileRoute("/category/$category")({
    component: CategoryPage,
});

function CategoryPage() {
    const { category } = Route.useParams();

    const {
        data: prompts = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["categoryPrompts", category],
        queryFn: () =>
            fetchPromptsAdvanced({
                category,
                sort: "new",
            }),
    });

    if (isLoading) return <p className="text-gray-400">Loading prompts...</p>;
    if (isError) return <p className="text-red-500">Failed to load prompts.</p>;

    return (
        <div className="max-w-5xl">
            <h1 className="text-3xl font-bold capitalize">
                {category} Prompts
            </h1>
            <p className="text-gray-400 mt-2">
                Browse latest prompts in{" "}
                <span className="text-white">{category}</span>
            </p>

            <div className="mt-8 flex flex-col gap-4">
                {prompts.length === 0 ? (
                    <p className="text-gray-500">
                        No prompts found in this category.
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
                                Tags:
                                {p.tags?.length > 0 ? (
                                    <span className="ml-2">
                                        {p.tags.map((t, i) => (
                                            <Link
                                                key={i}
                                                to="/tag/$tag"
                                                params={{ tag: t }}
                                                className="text-blue-400 hover:underline mr-2"
                                            >
                                                #{t}
                                            </Link>
                                        ))}
                                    </span>
                                ) : (
                                    <span className="ml-2 text-gray-500">
                                        No tags
                                    </span>
                                )}
                            </p>

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
