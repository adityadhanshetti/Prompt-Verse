import Collection from "../models/Collection.model.js";
import Prompt from "../models/Prompt.model.js";
import User from "../models/User.model.js";
import { createNotification } from "../utils/createNotification.js";
import Interaction from "../models/Interaction.model.js";
import Notification from "../models/Notification.model.js";

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
            authorId: req.dbUser._id,
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
        const collection = await Collection.findById(req.params.id)
            .populate("authorId", "clerkId username avatar fullName")
            .populate(
                "prompts.promptId",
                "title category tags copiesCount likesCount forksCount createdAt",
            )
            .lean();

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        let isSaved = false;
        if (req.dbUser) {
            const hasSaved = await Interaction.findOne({
                userId: req.dbUser._id,
                targetId: collection._id,
                interactionType: "SAVE",
            });
            if (hasSaved) isSaved = true;
        }

        res.json({ ...collection, isSaved });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/collections/user/:userId (public)
export const getCollectionsByUser = async (req, res) => {
    try {
        const targetUser = await User.findOne({ clerkId: req.params.userId });
        if (!targetUser)
            return res.status(404).json({ message: "User not found" });

        const collections = await Collection.find({
            authorId: targetUser._id,
            visibility: "public",
        })
            .populate("authorId")
            .sort({ createdAt: -1 })
            .lean();

        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                interactionType: "SAVE",
            });
            mySavedIds = interactions
                .filter((i) => i.targetType === "Collection")
                .map((i) => i.targetId.toString());
        }

        const enriched = collections.map((col) => ({
            ...col,
            creator: col.authorId,
            isSaved: mySavedIds.includes(col._id.toString()),
        }));

        res.json(enriched);
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

        if (collection.authorId.toString() !== req.dbUser._id.toString()) {
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
                recipientId: prompt.authorId,
                senderId: req.dbUser._id,
                type: "collection_add",
                targetId: prompt._id,
                targetType: "Prompt",
                message: "added your prompt to a collection",
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

        if (collection.authorId.toString() !== req.dbUser._id.toString()) {
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

        if (collection.authorId.toString() !== req.dbUser._id.toString()) {
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
            authorId: req.dbUser._id,
        })
            .populate("authorId")
            .sort({
                createdAt: -1,
            })
            .lean();

        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                interactionType: "SAVE",
            });
            mySavedIds = interactions
                .filter((i) => i.targetType === "Collection")
                .map((i) => i.targetId.toString());
        }

        const enriched = collections.map((col) => ({
            ...col,
            creator: col.authorId,
            isSaved: mySavedIds.includes(col._id.toString()),
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCollectionsByUserId = async (req, res) => {
    try {
        const userId = req.params.id;

        const targetUser = await User.findOne({ clerkId: req.params.id });
        if (!targetUser)
            return res.status(404).json({ message: "User not found" });

        const collections = await Collection.find({
            authorId: targetUser._id,
            visibility: "public",
        })
            .populate("authorId")
            .sort({ createdAt: -1 })
            .lean();

        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                interactionType: "SAVE",
            });
            mySavedIds = interactions
                .filter((i) => i.targetType === "Collection")
                .map((i) => i.targetId.toString());
        }

        const enriched = collections.map((col) => ({
            ...col,
            isSaved: mySavedIds.includes(col._id.toString()),
        }));

        res.json(enriched);
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

        if (collection.authorId.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ message: "Not allowed" });
        }

        await Collection.findByIdAndDelete(collectionId);

        // Cascade cleanup: delete all Interactions (saves) for this collection
        await Interaction.deleteMany({ targetId: collectionId, targetType: "Collection" });

        // Cascade cleanup: delete all Notifications referencing this collection
        await Notification.deleteMany({ collectionId });

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
        if (sort === "largest")
            sortOption = { "prompts.length": -1, createdAt: -1 };

        const collections = await Collection.find(filter)
            .populate("authorId", "clerkId username avatar fullName")
            .sort(sortOption)
            .limit(60)
            .lean();

        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                interactionType: "SAVE",
            });
            mySavedIds = interactions
                .filter((i) => i.targetType === "Collection")
                .map((i) => i.targetId.toString());
        }

        const enriched = collections.map((c) => ({
            ...c,
            creator: c.authorId,
            isSaved: mySavedIds.includes(c._id.toString()),
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

        const interaction = await Interaction.findOne({
            userId: req.dbUser._id,
            targetId: collection._id,
            interactionType: "SAVE",
        });

        if (interaction) {
            await Interaction.findByIdAndDelete(interaction._id);
            collection.savesCount = Math.max(0, collection.savesCount - 1);
        } else {
            await Interaction.create({
                userId: req.dbUser._id,
                targetId: collection._id,
                targetType: "Collection",
                interactionType: "SAVE",
            });
            collection.savesCount += 1;
        }

        await collection.save();

        res.json({
            saved: !interaction,
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

        const interactions = await Interaction.find({
            userId: req.dbUser._id,
            interactionType: "SAVE",
            targetType: "Collection",
        });
        const savedCollectionIds = interactions.map((i) => i.targetId);

        const collections = await Collection.find({
            _id: { $in: savedCollectionIds },
            visibility: "public",
        })
            .populate("authorId", "clerkId username avatar fullName")
            .sort({ createdAt: -1 })
            .lean();

        const enriched = collections.map((c) => ({
            ...c,
            creator: c.authorId,
            isSaved: true,
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
