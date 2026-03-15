import Collection from "../models/Collection.model.js";
import Prompt from "../models/Prompt.model.js";
import User from "../models/User.model.js";
import { createNotification } from "../utils/createNotification.js";

// POST /api/collections (protected)
export const createCollection = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { title, description, visibility } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const collection = await Collection.create({
            title,
            description: description || "",
            visibility: visibility || "public",
            createdByClerkId: userId,
            prompts: [],
        });

        res.status(201).json(collection);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/collections/:id (public)
export const getCollectionById = async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id).populate(
            "prompts.promptId",
            "title category tags copiesCount likesCount forksCount createdAt",
        );

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/collections/user/:userId (public)
export const getCollectionsByUser = async (req, res) => {
    try {
        const collections = await Collection.find({
            createdByClerkId: req.params.userId,
            visibility: "public",
        }).sort({ createdAt: -1 });

        res.json(collections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/collections/:id/add (protected)
export const addPromptToCollection = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { promptId } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!promptId) {
            return res.status(400).json({ message: "promptId is required" });
        }

        const collection = await Collection.findById(req.params.id);

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        if (collection.createdByClerkId !== userId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const alreadyExists = collection.prompts.some(
            (p) => p.promptId.toString() === promptId,
        );

        if (alreadyExists) {
            return res.status(400).json({ message: "Prompt already added" });
        }

        collection.prompts.push({
            promptId,
            order: collection.prompts.length,
        });

        await collection.save();

        const prompt = await Prompt.findById(promptId);

        if (prompt) {
            await createNotification({
                userId: prompt.createdByClerkId,
                fromUserId: userId,
                type: "collection_add",
                promptId: prompt._id,
                collectionId: collection._id,
                message: `added your prompt to collection "${collection.title}"`,
            });
        }

        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/collections/:id/remove/:promptId (protected)
export const removePromptFromCollection = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id, promptId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const collection = await Collection.findById(id);

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        if (collection.createdByClerkId !== userId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        collection.prompts = collection.prompts.filter(
            (p) => p.promptId.toString() !== promptId,
        );

        // reassign order
        collection.prompts = collection.prompts.map((p, index) => ({
            ...p.toObject(),
            order: index,
        }));

        await collection.save();

        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/collections/:id/reorder (protected)
export const reorderCollectionPrompts = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { prompts } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const collection = await Collection.findById(req.params.id);

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        if (collection.createdByClerkId !== userId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        if (!Array.isArray(prompts)) {
            return res
                .status(400)
                .json({ message: "prompts must be an array" });
        }

        // prompts = [{promptId, order}]
        collection.prompts = prompts;

        await collection.save();

        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/collections/my (protected)
export const getMyCollections = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const collections = await Collection.find({
            createdByClerkId: userId,
        }).sort({
            createdAt: -1,
        });

        res.json(collections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCollectionsByUserId = async (req, res) => {
    try {
        const userId = req.params.id;

        const collections = await Collection.find({
            createdByClerkId: userId,
            visibility: "public",
        }).sort({ createdAt: -1 });

        res.json(collections);
    } catch (error) {
        console.log("GET USER COLLECTIONS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/collections/:id (protected)
export const deleteCollection = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const collectionId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const collection = await Collection.findById(collectionId);

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        if (collection.createdByClerkId !== userId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        await Collection.findByIdAndDelete(collectionId);

        res.json({ message: "Collection deleted successfully" });
    } catch (error) {
        console.log("DELETE COLLECTION ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/collections/explore (public)
export const getPublicCollections = async (req, res) => {
    try {
        const { search = "", sort = "new" } = req.query;

        const filter = { visibility: "public" };

        if (search.trim()) {
            filter.$or = [
                { title: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } },
            ];
        }

        let sortOption = { createdAt: -1 };
        if (sort === "popular") sortOption = { savesCount: -1, createdAt: -1 };
        if (sort === "largest") sortOption = { "prompts.length": -1, createdAt: -1 };

        const collections = await Collection.find(filter)
            .sort(sortOption)
            .limit(60)
            .lean();

        // Attach creator user data
        const clerkIds = [...new Set(collections.map((c) => c.createdByClerkId))];
        const users = await User.find(
            { clerkId: { $in: clerkIds } },
            "clerkId username avatar fullName",
        ).lean();
        const userMap = Object.fromEntries(users.map((u) => [u.clerkId, u]));

        const enriched = collections.map((c) => ({
            ...c,
            creator: userMap[c.createdByClerkId] ?? null,
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/collections/:id/save (protected) — toggle save
export const toggleSaveCollection = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const collection = await Collection.findById(req.params.id);
        if (!collection)
            return res.status(404).json({ message: "Collection not found" });

        const alreadySaved = collection.savedBy.includes(userId);

        if (alreadySaved) {
            collection.savedBy = collection.savedBy.filter((id) => id !== userId);
            collection.savesCount = Math.max(0, collection.savesCount - 1);
        } else {
            collection.savedBy.push(userId);
            collection.savesCount += 1;
        }

        await collection.save();

        res.json({
            saved: !alreadySaved,
            savesCount: collection.savesCount,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/collections/saved (protected) — get my saved collections
export const getSavedCollections = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const collections = await Collection.find({
            savedBy: userId,
            visibility: "public",
        })
            .sort({ createdAt: -1 })
            .lean();

        // Attach creator user data
        const clerkIds = [...new Set(collections.map((c) => c.createdByClerkId))];
        const users = await User.find(
            { clerkId: { $in: clerkIds } },
            "clerkId username avatar fullName",
        ).lean();
        const userMap = Object.fromEntries(users.map((u) => [u.clerkId, u]));

        const enriched = collections.map((c) => ({
            ...c,
            creator: userMap[c.createdByClerkId] ?? null,
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
