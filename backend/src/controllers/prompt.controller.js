import Prompt from "../models/Prompt.model.js";
import PromptVersion from "../models/PromptVersion.model.js";
import Follow from "../models/Follow.model.js";
import User from "../models/User.model.js";
import Collection from "../models/Collection.model.js";
import Post from "../models/Post.model.js";
import Notification from "../models/Notification.model.js";
import { createNotification } from "../utils/createNotification.js";
// import { GoogleGenAI } from "@google/genai"; // Kept for fallback reference
import { runOptimizationPipeline } from "../services/ollamaOptimizer.js";
import {
    upsertPromptToQdrant,
    deletePromptFromQdrant,
    searchSimilarPrompts,
} from "../services/qdrant.service.js";
import { generateEmbedding } from "../services/embedding.service.js";
import Interaction from "../models/Interaction.model.js";

import { config } from "dotenv";
config();

export const createPrompt = async (req, res) => {
    try {
        const clerkUserId = req.auth?.userId;

        if (!clerkUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const {
            title,
            promptText,
            tags,
            category,
            modelSupport,
            visibility,
            isTemplate,
            variables,
        } = req.body;

        if (!title || !promptText) {
            return res
                .status(400)
                .json({ message: "Title and promptText are required" });
        }

        const mongoDBUser = await User.findOne({ clerkId: clerkUserId });

        if (!mongoDBUser) {
            return res
                .status(401)
                .json({ message: "User is not found in MongoDB!" });
        }

        const prompt = await Prompt.create({
            title,
            promptText,
            tags: tags || [],
            category: category || "general",
            modelSupport: modelSupport || [],
            visibility: visibility || "public",
            authorId: mongoDBUser._id,

            // IMPORTANT FIX
            isTemplate: Boolean(isTemplate),
            variables: Boolean(isTemplate) ? variables || [] : [],
        });

        // Add to Qdrant for Semantic Search
        try {
            const textToEmbed = `${prompt.title}. ${prompt.promptText} tags: ${prompt.tags.join(" ")} category: ${prompt.category}`;
            const embedding = await generateEmbedding(textToEmbed);
            await upsertPromptToQdrant(prompt._id, embedding, {
                visibility: prompt.visibility,
                category: prompt.category,
                isTemplate: prompt.isTemplate,
            });
        } catch (e) {
            console.error("Failed to generate/upsert embedding:", e);
        }

        res.status(201).json(prompt);
    } catch (error) {
        console.error("CREATE PROMPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getAllPrompts = async (req, res) => {
    try {
        const { search, category, tag, isTemplate, model, sort } = req.query;
        const useSemantic = Boolean(search);

        let semanticIds = null;
        let qdrantResults = [];

        if (search) {
            try {
                const embedding = await generateEmbedding(search);
                qdrantResults = await searchSimilarPrompts(embedding, 50);
                semanticIds = qdrantResults
                    .map((p) => p.payload?.mongoId)
                    .filter(Boolean);
            } catch (e) {
                console.error("Semantic search failed", e);
            }
        }

        const query = { visibility: "public" };

        if (semanticIds && semanticIds.length > 0) {
            query._id = { $in: semanticIds };
        } else if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { promptText: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { modelSupport: { $regex: search, $options: "i" } },
            ];

            if (!semanticIds || semanticIds.length === 0) {
                console.warn(
                    "Semantic search returned no IDs; falling back to text search.",
                );
            }
        }

        if (category) {
            query.category = category;
        }

        if (tag) {
            query.tags = { $in: [tag] };
        }

        if (isTemplate === "true") {
            query.isTemplate = true;
        }

        if (model) {
            query.modelSupport = { $in: [model] };
        }

        let sortQuery = {};
        let shouldSortByRelevance = false;

        if (sort === "likes") sortQuery = { likesCount: -1 };
        else if (sort === "forks") sortQuery = { forksCount: -1 };
        else if (sort === "copies") sortQuery = { copiesCount: -1 };
        else if (sort === "saves") sortQuery = { savesCount: -1 };
        else if (sort === "trending") {
            sortQuery = {
                likesCount: -1,
                forksCount: -1,
                copiesCount: -1,
                savesCount: -1,
                createdAt: -1,
            };
        } else if (semanticIds && semanticIds.length > 0) {
            shouldSortByRelevance = true;
        } else {
            sortQuery = { createdAt: -1 };
        }

        let promptQuery = Prompt.find(query).populate("authorId");
        if (Object.keys(sortQuery).length > 0) {
            promptQuery = promptQuery.sort(sortQuery);
        }

        let prompts = await promptQuery;

        if (shouldSortByRelevance && semanticIds && semanticIds.length > 0) {
            const orderMap = new Map(
                semanticIds.map((id, index) => [id.toString(), index]),
            );
            prompts = prompts.sort(
                (a, b) =>
                    (orderMap.get(a._id.toString()) ??
                        Number.MAX_SAFE_INTEGER) -
                    (orderMap.get(b._id.toString()) ?? Number.MAX_SAFE_INTEGER),
            );
        }

        let myLikedIds = [];
        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                targetType: "Prompt",
            });
            myLikedIds = interactions
                .filter((i) => i.interactionType === "LIKE")
                .map((i) => i.targetId.toString());
            mySavedIds = interactions
                .filter((i) => i.interactionType === "SAVE")
                .map((i) => i.targetId.toString());
        }

        const enrichedPrompts = prompts.map((prompt) => ({
            ...prompt.toObject(),
            isLiked: myLikedIds.includes(prompt._id.toString()),
            isSaved: mySavedIds.includes(prompt._id.toString()),
        }));

        res.json(enrichedPrompts);
    } catch (error) {
        console.error("GET PROMPTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// GET PROMPT BY ID
// GET /api/prompts/:id
export const getPromptById = async (req, res) => {
    try {
        const prompt = await Prompt.findById(req.params.id)
            .populate("authorId")
            .populate({
                path: "forkedFrom",
                select: "title authorId category tags forksCount likesCount",
                populate: { path: "authorId", select: "username clerkId" },
            })
            .populate({
                path: "forkedFromUser",
                select: "username clerkId",
            });

        if (!prompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        // Enrich with isLiked/isSaved/hasForked for the current user
        let isLiked = false;
        let isSaved = false;
        let hasForked = false;
        if (req.dbUser) {
            const [likeInteraction, saveInteraction, existingFork] =
                await Promise.all([
                    Interaction.findOne({
                        userId: req.dbUser._id,
                        targetId: prompt._id,
                        interactionType: "LIKE",
                    }),
                    Interaction.findOne({
                        userId: req.dbUser._id,
                        targetId: prompt._id,
                        interactionType: "SAVE",
                    }),
                    Prompt.findOne({
                        forkedFrom: prompt._id,
                        authorId: req.dbUser._id,
                    }).select("_id title"),
                ]);
            isLiked = !!likeInteraction;
            isSaved = !!saveInteraction;
            hasForked = existingFork
                ? { _id: existingFork._id, title: existingFork.title }
                : false;
        }

        res.json({ ...prompt.toObject(), isLiked, isSaved, hasForked });
    } catch (error) {
        console.error("GET PROMPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// INCREMENT COPY COUNT
// POST /api/prompts/:id/copy
export const incrementCopyCount = async (req, res) => {
    try {
        const prompt = await Prompt.findById(req.params.id);

        if (!prompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        prompt.copiesCount += 1;
        await prompt.save();

        res.json({ message: "Copy count incremented", copiesCount: prompt.copiesCount });
    } catch (error) {
        console.error("COPY ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// FORK PROMPT
// POST /api/prompts/:id/fork (protected)
export const forkPrompt = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const originalPrompt = await Prompt.findById(req.params.id).populate(
            "authorId",
            "username clerkId",
        );

        if (!originalPrompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        // Prevent duplicate forks by the same user
        const existingFork = await Prompt.findOne({
            forkedFrom: originalPrompt._id,
            authorId: req.dbUser._id,
        });

        if (existingFork) {
            return res.status(409).json({
                message: "You have already forked this prompt",
                existingFork: {
                    _id: existingFork._id,
                    title: existingFork.title,
                },
            });
        }

        // Accept optional customization from request body
        const {
            title: customTitle,
            promptText: customText,
            tags: customTags,
            category: customCategory,
            visibility: customVisibility,
        } = req.body;

        const forkedPrompt = await Prompt.create({
            title: customTitle || `${originalPrompt.title} (Fork)`,
            promptText: customText || originalPrompt.promptText,
            tags: customTags || originalPrompt.tags,
            category: customCategory || originalPrompt.category,
            modelSupport: originalPrompt.modelSupport,
            visibility: customVisibility || "public",
            authorId: req.dbUser._id,
            forkedFrom: originalPrompt._id,
            forkedFromUser: originalPrompt.authorId._id,
            isTemplate: originalPrompt.isTemplate,
            variables: originalPrompt.variables,
        });

        originalPrompt.forksCount += 1;
        await originalPrompt.save();

        // Index forked prompt into Qdrant for semantic search
        try {
            const textToEmbed = `${forkedPrompt.title}. ${forkedPrompt.promptText} tags: ${forkedPrompt.tags.join(" ")} category: ${forkedPrompt.category}`;
            const embedding = await generateEmbedding(textToEmbed);
            await upsertPromptToQdrant(forkedPrompt._id, embedding, {
                visibility: forkedPrompt.visibility,
                category: forkedPrompt.category,
                isTemplate: forkedPrompt.isTemplate,
            });
        } catch (e) {
            console.error("Failed to index forked prompt to Qdrant:", e);
        }

        // notification (don't notify if forking own prompt)
        if (originalPrompt.authorId._id.toString() !== req.dbUser._id.toString()) {
            await createNotification({
                recipientId: originalPrompt.authorId._id,
                senderId: req.dbUser._id,
                type: "fork",
                targetId: originalPrompt._id,
                targetType: "Prompt",
            });
        }

        // Populate before returning
        const populatedFork = await Prompt.findById(forkedPrompt._id)
            .populate("authorId", "username clerkId")
            .populate({
                path: "forkedFrom",
                select: "title authorId",
                populate: { path: "authorId", select: "username clerkId" },
            });

        res.status(201).json(populatedFork);
    } catch (error) {
        console.error("FORK ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// GET FORKS
// GET /api/prompts/:id/forks
export const getForksOfPrompt = async (req, res) => {
    try {
        const forks = await Prompt.find({ forkedFrom: req.params.id })
            .populate("authorId", "username clerkId")
            .select(
                "title promptText tags category authorId likesCount copiesCount forksCount savesCount createdAt",
            )
            .sort({ createdAt: -1 });

        // Return total count alongside the forks array
        res.json({
            forks,
            totalForks: forks.length,
        });
    } catch (error) {
        console.error("GET FORKS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// UPDATE PROMPT + VERSIONING
// PATCH /api/prompts/:id (protected)
export const updatePrompt = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const promptId = req.params.id;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const prompt = await Prompt.findById(promptId);
        if (!prompt)
            return res.status(404).json({ message: "Prompt not found" });

        if (prompt.authorId.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ message: "Not allowed" });
        }

        // Find latest version number
        const latestVersion = await PromptVersion.findOne({ promptId })
            .sort({ versionNumber: -1 })
            .lean();

        const nextVersionNumber = latestVersion
            ? latestVersion.versionNumber + 1
            : 1;

        // Save current prompt state as version BEFORE updating
        await PromptVersion.create({
            promptId: prompt._id,
            versionNumber: nextVersionNumber,
            title: prompt.title,
            promptText: prompt.promptText,
            tags: prompt.tags,
            category: prompt.category,
            modelSupport: prompt.modelSupport,
            visibility: prompt.visibility,
            isTemplate: prompt.isTemplate,
            variables: prompt.variables,
            editedBy: req.dbUser._id,
        });

        // Update prompt with new values
        const {
            title,
            promptText,
            tags,
            category,
            modelSupport,
            visibility,
            isTemplate,
            variables,
        } = req.body;

        if (title !== undefined) prompt.title = title;
        if (promptText !== undefined) prompt.promptText = promptText;
        if (tags !== undefined) prompt.tags = tags;
        if (category !== undefined) prompt.category = category;
        if (modelSupport !== undefined) prompt.modelSupport = modelSupport;
        if (visibility !== undefined) prompt.visibility = visibility;
        if (isTemplate !== undefined) prompt.isTemplate = isTemplate;
        if (variables !== undefined) prompt.variables = variables;

        await prompt.save();

        // Update Qdrant vector for Semantic Search
        try {
            const textToEmbed = `${prompt.title}. ${prompt.promptText} tags: ${prompt.tags.join(" ")} category: ${prompt.category}`;
            const embedding = await generateEmbedding(textToEmbed);
            await upsertPromptToQdrant(prompt._id, embedding, {
                visibility: prompt.visibility,
                category: prompt.category,
                isTemplate: prompt.isTemplate,
            });
        } catch (e) {
            console.error("Failed to update embedding:", e);
        }

        res.json(prompt);
    } catch (error) {
        console.log("UPDATE ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// GET PROMPT VERSIONS
// GET /api/prompts/:id/versions

export const getPromptVersions = async (req, res) => {
    try {
        const versions = await PromptVersion.find({
            promptId: req.params.id,
        })
            .populate("editedBy", "username clerkId")
            .sort({ createdAt: -1 });

        res.json({
            versions,
            totalVersions: versions.length,
        });
    } catch (error) {
        console.error("GET VERSIONS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// RESTORE VERSION
// POST /api/prompts/:id/restore/:versionId (protected)

export const restorePromptVersion = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const prompt = await Prompt.findById(req.params.id);

        if (!prompt)
            return res.status(404).json({ message: "Prompt not found" });

        if (prompt.authorId.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const version = await PromptVersion.findById(req.params.versionId);

        if (!version) {
            return res.status(404).json({ message: "Version not found" });
        }

        // save current state as a new version before restoring
        const latestVersion = await PromptVersion.findOne({
            promptId: prompt._id,
        })
            .sort({ versionNumber: -1 })
            .lean();

        const nextVersionNumber = latestVersion
            ? latestVersion.versionNumber + 1
            : 1;

        await PromptVersion.create({
            promptId: prompt._id,
            versionNumber: nextVersionNumber,
            title: prompt.title,
            promptText: prompt.promptText,
            tags: prompt.tags,
            category: prompt.category,
            modelSupport: prompt.modelSupport,
            visibility: prompt.visibility,
            isTemplate: prompt.isTemplate,
            variables: prompt.variables,
            changeNote: "Restored previous version",
            editedBy: req.dbUser._id,
        });

        prompt.title = version.title;
        prompt.promptText = version.promptText;
        prompt.tags = version.tags;
        prompt.category = version.category;
        prompt.modelSupport = version.modelSupport;
        prompt.visibility = version.visibility;
        prompt.isTemplate = version.isTemplate;
        prompt.variables = version.variables;

        await prompt.save();

        try {
            const textToEmbed = `${prompt.title}. ${prompt.promptText} tags: ${prompt.tags.join(" ")} category: ${prompt.category}`;
            const embedding = await generateEmbedding(textToEmbed);
            await upsertPromptToQdrant(prompt._id, embedding, {
                visibility: prompt.visibility,
                category: prompt.category,
                isTemplate: prompt.isTemplate,
            });
        } catch (e) {
            console.error("Failed to update embedding after restore:", e);
        }

        res.json(prompt);
    } catch (error) {
        console.error("RESTORE ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// TOGGLE LIKE
// POST /api/prompts/:id/like (protected)

export const toggleLikePrompt = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const prompt = await Prompt.findById(req.params.id);

        if (!prompt)
            return res.status(404).json({ message: "Prompt not found" });

        const interaction = await Interaction.findOne({
            userId: req.dbUser._id,
            targetId: prompt._id,
            interactionType: "LIKE",
        });

        if (interaction) {
            await Interaction.findByIdAndDelete(interaction._id);
            prompt.likesCount = Math.max(0, prompt.likesCount - 1);
        } else {
            await Interaction.create({
                userId: req.dbUser._id,
                targetId: prompt._id,
                targetType: "Prompt",
                interactionType: "LIKE",
            });
            prompt.likesCount += 1;

            if (prompt.authorId.toString() !== req.dbUser._id.toString()) {
                await createNotification({
                    recipientId: prompt.authorId,
                    senderId: req.dbUser._id,
                    type: "like",
                    targetId: prompt._id,
                    targetType: "Prompt",
                    message: "liked your prompt",
                });
            }
        }

        await prompt.save();

        res.json({
            liked: !interaction,
            likesCount: prompt.likesCount,
        });
    } catch (error) {
        console.error("LIKE ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// TOGGLE SAVE
// POST /api/prompts/:id/save (protected)

export const toggleSavePrompt = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const prompt = await Prompt.findById(req.params.id);

        if (!prompt)
            return res.status(404).json({ message: "Prompt not found" });

        const interaction = await Interaction.findOne({
            userId: req.dbUser._id,
            targetId: prompt._id,
            interactionType: "SAVE",
        });

        if (interaction) {
            await Interaction.findByIdAndDelete(interaction._id);
            prompt.savesCount = Math.max(0, prompt.savesCount - 1);
        } else {
            await Interaction.create({
                userId: req.dbUser._id,
                targetId: prompt._id,
                targetType: "Prompt",
                interactionType: "SAVE",
            });
            prompt.savesCount += 1;

            if (prompt.authorId.toString() !== req.dbUser._id.toString()) {
                await createNotification({
                    recipientId: prompt.authorId,
                    senderId: req.dbUser._id,
                    type: "save",
                    targetId: prompt._id,
                    targetType: "Prompt",
                    message: "saved your prompt",
                });
            }
        }

        await prompt.save();

        res.json({
            saved: !interaction,
            savesCount: prompt.savesCount,
        });
    } catch (error) {
        console.error("SAVE ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// TRENDING PROMPTS
// GET /api/prompts/trending

export const getTrendingPrompts = async (req, res) => {
    try {
        const { range = "week", category } = req.query;

        const query = { visibility: "public" };

        // Time-range filter
        const now = new Date();
        if (range === "today") {
            query.createdAt = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
        } else if (range === "week") {
            query.createdAt = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        } else if (range === "month") {
            query.createdAt = {
                $gte: new Date(now - 30 * 24 * 60 * 60 * 1000),
            };
        }
        // "all" → no date filter

        if (category) {
            query.category = category;
        }

        const prompts = await Prompt.find(query)
            .populate("authorId")
            .sort({
                likesCount: -1,
                forksCount: -1,
                copiesCount: -1,
                savesCount: -1,
                createdAt: -1,
            })
            .limit(50);

        let myLikedIds = [];
        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                targetType: "Prompt",
            });
            myLikedIds = interactions
                .filter((i) => i.interactionType === "LIKE")
                .map((i) => i.targetId.toString());
            mySavedIds = interactions
                .filter((i) => i.interactionType === "SAVE")
                .map((i) => i.targetId.toString());
        }

        const enrichedPrompts = prompts.map((prompt) => ({
            ...prompt.toObject(),
            isLiked: myLikedIds.includes(prompt._id.toString()),
            isSaved: mySavedIds.includes(prompt._id.toString()),
        }));

        res.json(enrichedPrompts);
    } catch (error) {
        console.error("TRENDING ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// import Follow from "../models/follow.model.js"; // adjust path if different

export const getPromptsFeed = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        // find who user follows
        const following = await Follow.find({
            followerId: req.dbUser._id,
        }).select("followingId");

        const followingIds = following.map((f) => f.followingId);

        const prompts = await Prompt.find({
            authorId: { $in: followingIds },
            visibility: "public",
        })
            .populate("authorId")
            .sort({ createdAt: -1 })
            .limit(100);

        let myLikedIds = [];
        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                targetType: "Prompt",
            });
            myLikedIds = interactions
                .filter((i) => i.interactionType === "LIKE")
                .map((i) => i.targetId.toString());
            mySavedIds = interactions
                .filter((i) => i.interactionType === "SAVE")
                .map((i) => i.targetId.toString());
        }

        const enrichedPrompts = prompts.map((prompt) => ({
            ...prompt.toObject(),
            isLiked: myLikedIds.includes(prompt._id.toString()),
            isSaved: mySavedIds.includes(prompt._id.toString()),
        }));

        res.json(enrichedPrompts);
    } catch (error) {
        console.log("FEED ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getPromptsByUserId = async (req, res) => {
    try {
        const userId = req.params.id;

        const targetUser = await User.findOne({ clerkId: userId });
        if (!targetUser)
            return res.status(404).json({ message: "User not found" });

        const prompts = await Prompt.find({
            authorId: targetUser._id,
            visibility: "public",
        })
            .populate("authorId")
            .sort({ createdAt: -1 });

        let myLikedIds = [];
        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                targetType: "Prompt",
            });
            myLikedIds = interactions
                .filter((i) => i.interactionType === "LIKE")
                .map((i) => i.targetId.toString());
            mySavedIds = interactions
                .filter((i) => i.interactionType === "SAVE")
                .map((i) => i.targetId.toString());
        }

        const enrichedPrompts = prompts.map((prompt) => ({
            ...prompt.toObject(),
            isLiked: myLikedIds.includes(prompt._id.toString()),
            isSaved: mySavedIds.includes(prompt._id.toString()),
        }));

        res.json(enrichedPrompts);
    } catch (error) {
        console.log("GET USER PROMPTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getSavedPrompts = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const savedInteractions = await Interaction.find({
            userId: req.dbUser._id,
            targetType: "Prompt",
            interactionType: "SAVE",
        });
        const savedPromptIds = savedInteractions.map((i) => i.targetId);

        const prompts = await Prompt.find({
            _id: { $in: savedPromptIds },
            visibility: "public",
        })
            .populate("authorId")
            .sort({ createdAt: -1 });

        let myLikedIds = [];
        let mySavedIds = [];
        if (req.dbUser) {
            const interactions = await Interaction.find({
                userId: req.dbUser._id,
                targetType: "Prompt",
            });
            myLikedIds = interactions
                .filter((i) => i.interactionType === "LIKE")
                .map((i) => i.targetId.toString());
            mySavedIds = interactions
                .filter((i) => i.interactionType === "SAVE")
                .map((i) => i.targetId.toString());
        }

        const enrichedPrompts = prompts.map((prompt) => ({
            ...prompt.toObject(),
            isLiked: myLikedIds.includes(prompt._id.toString()),
            isSaved: mySavedIds.includes(prompt._id.toString()),
        }));

        res.json(enrichedPrompts);
    } catch (error) {
        console.log("GET SAVED PROMPTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deletePrompt = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const promptId = req.params.id;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const prompt = await Prompt.findById(promptId);

        if (!prompt)
            return res.status(404).json({ message: "Prompt not found" });

        if (prompt.authorId.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ message: "Not allowed" });
        }

        // Delete the prompt
        await Prompt.findByIdAndDelete(promptId);

        // ── Cascade cleanup ──────────────────────────────────────────

        // 1. Remove this prompt from all collections
        await Collection.updateMany(
            { "prompts.promptId": promptId },
            { $pull: { prompts: { promptId } } },
        );

        // 2. Delete all Interactions (likes/saves) referencing this prompt
        await Interaction.deleteMany({ targetId: promptId, targetType: "Prompt" });

        // 3. Delete all Notifications referencing this prompt
        await Notification.deleteMany({ promptId });

        // 4. Delete all PromptVersions for this prompt
        await PromptVersion.deleteMany({ promptId });

        // 5. Unlink this prompt from any Posts that referenced it
        await Post.updateMany(
            { linkedPromptId: promptId },
            { $set: { linkedPromptId: null } },
        );

        // 6. Clear forkedFrom reference in prompts forked from this one
        await Prompt.updateMany(
            { forkedFrom: promptId },
            { $set: { forkedFrom: null } },
        );

        // 7. Delete from Qdrant
        try {
            await deletePromptFromQdrant(promptId);
        } catch (e) {
            console.error("Failed to delete Qdrant point:", e);
        }

        res.json({ message: "Prompt deleted successfully" });
    } catch (error) {
        console.log("DELETE PROMPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// export const optimizePrompt = async (req, res) => {
//     try {
//         const { title, promptText, tags, category, modelSupport, isTemplate, variables } = req.body;

//         if (!promptText) {
//             return res.status(400).json({ message: "No prompt text provided" });
//         }

//         const puter = init(process.env.PUTER_AUTH_TOKEN || process.env.PUTER_API_KEY);

//         const systemInstruction = "You are an elite AI Prompt Engineer. Your singular objective is to transform the provided raw user prompt into an exceptionally clear, detailed, and highly effective prompt optimized for Large Language Models (LLMs).\n\nFollow these guidelines:\n1. Sharpen clarity and eliminate ambiguity.\n2. Add necessary context or placeholder variables if implicit.\n3. Structure logically (e.g., using markdown, clear headings, or bullet points if appropriate).\n4. Apply best practices for instruction-following behavior.\n5. DO NOT answer the user's prompt or converse. YOUR ONLY OUTPUT MUST BE THE REWRITTEN PROMPT ITSELF, nothing more, no intro or outro.";

//         const response = await puter.ai.chat(
//             `${systemInstruction}\n\nHere is the raw prompt to optimize:\n\n--- RAW PROMPT ---\n${promptText}\n--- END RAW PROMPT ---`,
//             { model: "claude-3-5-sonnet" }
//         );

//         const optimizedPrompt = typeof response === "string" ? response : response.toString();

//         const updatedPrompt = await Prompt.findByIdAndUpdate(
//             req.auth.userId,
//             {
//                 title,
//                 promptText: optimizedPrompt,
//                 tags,
//                 category,
//                 modelSupport,
//                 isTemplate,
//                 variables,
//             },
//             { new: true }
//         );

//         res.json(updatedPrompt);
//     } catch (error) {
//         console.error("OPTIMIZE PROMPT ERROR:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

export const optimizePrompt = async (req, res) => {
    try {
        const {
            title,
            promptText,
            category,
            tags,
            modelSupport,
            isTemplate,
            variables,
        } = req.body;

        if (!promptText) {
            return res.status(400).json({ message: "No prompt text provided" });
        }

        const result = await runOptimizationPipeline({
            title,
            promptText,
            category,
            tags,
            modelSupport,
            isTemplate,
            variables,
        });

        res.json(result);
    } catch (error) {
        console.error("OPTIMIZE PROMPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};
