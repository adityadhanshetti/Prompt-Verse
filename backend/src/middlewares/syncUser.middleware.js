import clerkClient  from "../configs/clerkClient.js";
import User from "../models/User.model.js";

export const syncUser = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) return next(); // public route allowed

        // check if already exists
        let user = await User.findOne({ clerkId: userId });

        if (!user) {
            // fetch from Clerk
            const clerkUser = await clerkClient.users.getUser(userId);

            user = await User.create({
                clerkId: clerkUser.id,
                username: clerkUser.username || null,
                email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
                fullName: `${clerkUser.firstName || ""} ${
                    clerkUser.lastName || ""
                }`.trim(),
                avatar: clerkUser.imageUrl || null,
            });

            console.log("✅ User created in DB:", user.clerkId);
        } else {
            // optional update (keep latest username/avatar)
            const clerkUser = await clerkClient.users.getUser(userId);

            user.username = clerkUser.username || user.username;
            user.email =
                clerkUser.emailAddresses?.[0]?.emailAddress || user.email;
            user.fullName =
                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
                user.fullName;
            user.avatar = clerkUser.imageUrl || user.avatar;

            await user.save();
        }

        req.dbUser = user; // attach db user to request
        next();
    } catch (error) {
        console.log("SYNC USER ERROR:", error.message);
        next();
    }
};
