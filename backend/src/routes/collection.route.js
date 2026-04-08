import express from "express";
import {
    createCollection,
    getCollectionById,
    getCollectionsByUser,
    addPromptToCollection,
    removePromptFromCollection,
    reorderCollectionPrompts,
    getMyCollections,
    getCollectionsByUserId,
    deleteCollection,
    getPublicCollections,
    toggleSaveCollection,
    getSavedCollections,
} from "../controllers/collection.controller.js";

import { requireAuth } from "@clerk/express";

const router = express.Router();

// create collection
router.post("/", requireAuth(), createCollection);

router.get("/my", requireAuth(), getMyCollections);

// public explore collections
router.get("/explore", getPublicCollections);

// saved collections (protected)
router.get("/saved", requireAuth(), getSavedCollections);

// public get collection
router.get("/:id", getCollectionById);

// public get collections of user
router.get("/user/:userId", getCollectionsByUser);

// add prompt
router.post("/:id/add", requireAuth(), addPromptToCollection);

// remove prompt
router.delete(
    "/:id/remove/:promptId",
    requireAuth(),
    removePromptFromCollection,
);

// reorder prompts
router.patch("/:id/reorder", requireAuth(), reorderCollectionPrompts);

// toggle save collection
router.post("/:id/save", requireAuth(), toggleSaveCollection);

// delete collection
router.delete("/:id", requireAuth(), deleteCollection);

export default router;
