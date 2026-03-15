import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

import { followUser, unfollowUser, checkFollowing } from "../lib/followApi.js";

export default function FollowButton({ targetUserId }) {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["followCheck", targetUserId],
        queryFn: async () => {
            const token = await getToken();
            return checkFollowing(targetUserId, token);
        },
    });

    const followMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return followUser(targetUserId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["followCheck", targetUserId]);
            queryClient.invalidateQueries(["followStats", targetUserId]);
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            return unfollowUser(targetUserId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["followCheck", targetUserId]);
            queryClient.invalidateQueries(["followStats", targetUserId]);
        },
    });

    if (isLoading) return null;

    const isFollowing = data?.isFollowing;

    return (
        <button
            onClick={() =>
                isFollowing
                    ? unfollowMutation.mutate()
                    : followMutation.mutate()
            }
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                isFollowing
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-blue-600 hover:bg-blue-500"
            }`}
        >
            {isFollowing ? "Following" : "Follow"}
        </button>
    );
}
