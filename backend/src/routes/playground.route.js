import express from "express";
import {
    getPlaygroundModels,
    runSingleModel,
    runComparison,
} from "../controllers/playground.controller.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const router = express.Router();

// Public — returns catalog + availability
router.get("/models", getPlaygroundModels);

// Protected — runs cost resources on the server
router.post("/run", requireAuth(), runSingleModel);
router.post("/compare", requireAuth(), runComparison);

export default router;
