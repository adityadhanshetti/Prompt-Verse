import express from "express";
import {
    createPrompt,
    getPromptById,
    getPromptsFeed,
    incrementCopyCount,
    forkPrompt,
    getForksOfPrompt,
    updatePrompt,
    restorePromptVersion,
    getPromptVersions,
    getAllPrompts,
    getTrendingPrompts,
    toggleLikePrompt,
    toggleSavePrompt,
    getPromptsByUserId,
    getSavedPrompts,
    deletePrompt,
    optimizePrompt,
} from "../controllers/prompt.controller.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const router = express.Router();

router.post("/", requireAuth(), createPrompt);
router.post("/optimize", requireAuth(), optimizePrompt);
router.get("/", getAllPrompts);
router.get("/trending", getTrendingPrompts);

router.get("/user/:id", getPromptsByUserId);

router.get("/saved/me", requireAuth(), getSavedPrompts);

router.delete("/:id", requireAuth(), deletePrompt);


router.get("/:id", getPromptById);

router.post("/:id/copy", incrementCopyCount);

router.post("/:id/fork", requireAuth(), forkPrompt);
router.get("/:id/forks", getForksOfPrompt);

router.patch("/:id", requireAuth(), updatePrompt);

router.get("/:id/versions", getPromptVersions);
router.post("/:id/restore/:versionId", requireAuth(), restorePromptVersion);

router.post("/:id/like", requireAuth(), toggleLikePrompt);
router.post("/:id/save", requireAuth(), toggleSavePrompt);


export default router;
