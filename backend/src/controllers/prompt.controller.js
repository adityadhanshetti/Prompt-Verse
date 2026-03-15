import Prompt from "../models/Prompt.model.js";
import PromptVersion from "../models/PromptVersion.model.js";
import Follow from "../models/Follow.model.js";
import User from "../models/User.model.js";
import Collection from "../models/Collection.model.js";
import { createNotification } from "../utils/createNotification.js";
import { GoogleGenAI } from "@google/genai";

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
            createdByClerkId: clerkUserId,
            createdByMongoDBObjectId: mongoDBUser._id,

            // IMPORTANT FIX
            isTemplate: Boolean(isTemplate),
            variables: Boolean(isTemplate) ? variables || [] : [],
        });

        res.status(201).json(prompt);
    } catch (error) {
        console.error("CREATE PROMPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getAllPrompts = async (req, res) => {
    try {
        const { search, category, tag, isTemplate, model, sort } = req.query;

        const query = { visibility: "public" };

        // search title, promptText, tags, category, modelSupport
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { promptText: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { modelSupport: { $regex: search, $options: "i" } },
            ];
        }

        // category filter
        if (category) {
            query.category = category;
        }

        // tag filter
        if (tag) {
            query.tags = { $in: [tag] };
        }

        // template filter
        if (isTemplate === "true") {
            query.isTemplate = true;
        }

        // model filter
        if (model) {
            query.modelSupport = { $in: [model] };
        }

        let sortQuery = { createdAt: -1 };

        // sorting
        if (sort === "new") sortQuery = { createdAt: -1 };
        if (sort === "likes") sortQuery = { likesCount: -1 };
        if (sort === "forks") sortQuery = { forksCount: -1 };
        if (sort === "copies") sortQuery = { copiesCount: -1 };
        if (sort === "saves") sortQuery = { savesCount: -1 };

        // trending formula (basic)
        if (sort === "trending") {
            sortQuery = {
                likesCount: -1,
                forksCount: -1,
                copiesCount: -1,
                savesCount: -1,
                createdAt: -1,
            };
        }

        const prompts = await Prompt.find(query)
            .populate("createdByMongoDBObjectId")
            .sort(sortQuery)
            .limit(200);
        // console.log(prompts);

        res.json(prompts);
    } catch (error) {
        console.error("GET PROMPTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// GET PROMPT BY ID
// GET /api/prompts/:id
export const getPromptById = async (req, res) => {
    try {
        const prompt = await Prompt.findById(req.params.id).populate(
            "createdByMongoDBObjectId",
        );
        // console.log(prompt, "Prompt\n");

        if (!prompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        res.json(prompt);
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

        res.json({ message: "Copy count incremented" });
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

        const originalPrompt = await Prompt.findById(req.params.id);

        if (!originalPrompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        const forkedPrompt = await Prompt.create({
            title: `${originalPrompt.title} (Fork)`,
            promptText: originalPrompt.promptText,
            tags: originalPrompt.tags,
            category: originalPrompt.category,
            modelSupport: originalPrompt.modelSupport,
            visibility: "public",
            createdByClerkId: userId,
            forkedFrom: originalPrompt._id,
            forkedFromUser: originalPrompt.createdByClerkId,
            isTemplate: originalPrompt.isTemplate,
            variables: originalPrompt.variables,
        });

        originalPrompt.forksCount += 1;
        await originalPrompt.save();

        // notification
        await createNotification({
            userId: originalPrompt.createdByClerkId,
            fromUserId: userId,
            type: "fork",
            promptId: originalPrompt._id,
            message: "forked your prompt",
        });

        res.status(201).json(forkedPrompt);
    } catch (error) {
        console.error("FORK ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// GET FORKS
// GET /api/prompts/:id/forks
export const getForksOfPrompt = async (req, res) => {
    try {
        const forks = await Prompt.find({ forkedFrom: req.params.id }).sort({
            createdAt: -1,
        });

        res.json(forks);
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

        if (prompt.createdByClerkId !== userId) {
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
            editedBy: userId,
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
        }).sort({ createdAt: -1 });

        res.json(versions);
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

        if (prompt.createdByClerkId !== userId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const version = await PromptVersion.findById(req.params.versionId);

        if (!version) {
            return res.status(404).json({ message: "Version not found" });
        }

        // save current as new version
        await PromptVersion.create({
            promptId: prompt._id,
            title: prompt.title,
            promptText: prompt.promptText,
            tags: prompt.tags,
            category: prompt.category,
            changeNote: "Restored previous version",
            createdByClerkId: userId,
        });

        prompt.title = version.title;
        prompt.promptText = version.promptText;
        prompt.tags = version.tags;
        prompt.category = version.category;

        await prompt.save();

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

        const alreadyLiked = prompt.likedBy.includes(userId);

        if (alreadyLiked) {
            prompt.likedBy = prompt.likedBy.filter((id) => id !== userId);
            prompt.likesCount = Math.max(0, prompt.likesCount - 1);
        } else {
            prompt.likedBy.push(userId);
            prompt.likesCount += 1;

            await createNotification({
                userId: prompt.createdByClerkId,
                fromUserId: userId,
                type: "like",
                promptId: prompt._id,
                message: "liked your prompt",
            });
        }

        await prompt.save();

        res.json({
            liked: !alreadyLiked,
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

        const alreadySaved = prompt.savedBy.includes(userId);

        if (alreadySaved) {
            prompt.savedBy = prompt.savedBy.filter((id) => id !== userId);
            prompt.savesCount = Math.max(0, prompt.savesCount - 1);
        } else {
            prompt.savedBy.push(userId);
            prompt.savesCount += 1;

            await createNotification({
                userId: prompt.createdByClerkId,
                fromUserId: userId,
                type: "save",
                promptId: prompt._id,
                message: "saved your prompt",
            });
        }

        await prompt.save();

        res.json({
            saved: !alreadySaved,
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
            .populate("createdByMongoDBObjectId")
            .sort({
                likesCount: -1,
                forksCount: -1,
                copiesCount: -1,
                savesCount: -1,
                createdAt: -1,
            })
            .limit(50);

        res.json(prompts);
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
        const following = await Follow.find({ followerId: userId }).select(
            "followingId",
        );

        const followingIds = following.map((f) => f.followingId);

        const prompts = await Prompt.find({
            createdByClerkId: { $in: followingIds },
            visibility: "public",
        })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(prompts);
    } catch (error) {
        console.log("FEED ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getPromptsByUserId = async (req, res) => {
    try {
        const userId = req.params.id;

        const prompts = await Prompt.find({
            createdByClerkId: userId,
            visibility: "public",
        }).sort({ createdAt: -1 });

        res.json(prompts);
    } catch (error) {
        console.log("GET USER PROMPTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getSavedPrompts = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const prompts = await Prompt.find({
            savedBy: userId,
            visibility: "public",
        }).sort({ createdAt: -1 });

        res.json(prompts);
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

        if (prompt.createdByClerkId !== userId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        // Delete the prompt
        await Prompt.findByIdAndDelete(promptId);

        // Remove this prompt from all collections
        await Collection.updateMany(
            { "prompts.promptId": promptId },
            { $pull: { prompts: { promptId } } },
        );

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
        console.log("HEYYYYYYYY");
        const { title, promptText, category, tags, modelSupport, isTemplate, variables } = req.body;

        if (!promptText) {
            return res.status(400).json({ message: "No prompt text provided" });
        }
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Uses process.env.GEMINI_API_KEY

        const systemInstruction = `You are an elite, world-class Prompt Engineer. Your objective is to optimize a user's raw prompt instructions into a highly precise, structured, and production-ready prompt. 

You will be provided with the following metadata about the prompt:
- Title
- Raw Prompt (The user's initial instructions)
- Category
- Tags
- Target Models (The models this prompt is intended for)
- Template Variables (If the prompt is dynamic, these are the placeholders like {{variable_name}})

INSTRUCTIONS FOR OPTIMIZATION:
1. Intent & Clarity: Deeply analyze the raw prompt to understand the core objective. Reconstruct the instructions so they are unambiguous, logical, and easy for an AI to parse.
2. Structure: Organize the prompt logically (e.g., Role, Context, Task, Constraints, Output Format). Use markdown formatting where appropriate for the prompt's internal structure.
3. Contextual Injection: Use the provided Category and Tags to infer the domain and inject necessary context that the user might have missed (e.g., if the category is "coding", ensure the prompt asks for clean, well-documented code).
4. Template Variables: If template variables are provided, seamlessly integrate them into the optimized prompt using the exact {{variable_name}} format. DO NOT alter the variable names or ignore them.Also if possibe u can add more template variables if required.
5. Model Specificity: If Target Models are provided, tailor the phrasing to abide by the best practices of those specific models.

OUTPUT CONSTRAINTS (CRITICAL):
- Your response must contain ONLY the final, optimized prompt text.
- DO NOT wrap the output in markdown code blocks.(example : #,** etc)
- DO NOT prefix the output with phrases like "Here is the optimized prompt:".
- DO NOT provide explanations, pleasantries, or commentary.
- Just output the raw, concentrated instruction text ready to be injected straight back into the user's text area.`;

        const userMessage = `Optimize the following prompt.

Title: ${title || "None"}
Category: ${category || "None"}
Tags: ${tags && tags.length > 0 ? tags.join(", ") : "None"}
Target Models: ${modelSupport && modelSupport.length > 0 ? modelSupport.join(", ") : "None"}
Has Variables: ${isTemplate ? "Yes" : "No"}
Variables: ${isTemplate && variables?.length > 0 ? JSON.stringify(variables) : "None"}

RAW PROMPT:
${promptText}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userMessage,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const optimizedPrompt = response.text;

        // const updatedPrompt = await Prompt.findByIdAndUpdate(
        //     req.auth.userId,
        //     {
        //         promptText: optimizedPrompt,
        //     },
        //     { new: true },
        // );
        res.json(optimizedPrompt);
    } catch (error) {
        console.error("OPTIMIZE PROMPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};
