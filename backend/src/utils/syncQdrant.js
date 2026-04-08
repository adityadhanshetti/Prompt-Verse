import mongoose from "mongoose";
import { connectDB } from "./connectDB.js";
import Prompt from "../models/Prompt.model.js";
import { upsertPromptToQdrant } from "../services/qdrant.service.js";
import { generateEmbedding } from "../services/embedding.service.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../../.env") });

const syncQdrant = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB. Fetching all prompts...");

        const prompts = await Prompt.find({});
        console.log(`Found ${prompts.length} prompts to sync.`);

        let success = 0;
        let failed = 0;

        for (const prompt of prompts) {
            try {
                const textToEmbed = `${prompt.title}. ${prompt.promptText} tags: ${prompt.tags.join(" ")} category: ${prompt.category}`;
                const embedding = await generateEmbedding(textToEmbed);
                
                await upsertPromptToQdrant(prompt._id, embedding, {
                    visibility: prompt.visibility,
                    category: prompt.category,
                    isTemplate: prompt.isTemplate
                });
                success++;
                process.stdout.write(`\rSuccessfully synced ${success}/${prompts.length}...`);
            } catch (err) {
                console.error(`\nFailed to sync prompt ${prompt._id}:`, err.message);
                failed++;
            }
        }

        console.log(`\n\nSync Complete!\nSuccessfully embedded: ${success}\nFailed: ${failed}`);
    } catch (error) {
        console.error("Sync script failed:", error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

syncQdrant();
