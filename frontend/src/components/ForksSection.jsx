import { useQuery } from "@tanstack/react-query";
import { fetchForks } from "../lib/promptApi.js";
import { Link } from "@tanstack/react-router";

export default function ForksSection({ promptId }) {
    const { data, isLoading } = useQuery({
        queryKey: ["forks", promptId],
        queryFn: () => fetchForks(promptId),
    });

    if (isLoading)
        return <p className="text-gray-400 mt-4">Loading forks...</p>;

    if (!data || data.length === 0) {
        return <p className="text-gray-500 mt-4">No forks yet.</p>;
    }

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Forks</h2>

            <div className="flex flex-col gap-3">
                {data.map((fork) => (
                    <div
                        key={fork._id}
                        className="border border-gray-800 bg-gray-900 p-4 rounded-xl"
                    >
                        <Link
                            to="/prompt/$id"
                            params={{ id: fork._id }}
                            className="font-semibold hover:underline"
                        >
                            {fork.title}
                        </Link>

                        <p className="text-gray-400 text-sm mt-1">
                            Forked from this prompt
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
