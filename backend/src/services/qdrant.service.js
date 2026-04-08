import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "dotenv";
config();

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
});

const PROMPT_COLLECTION = "prompts";

export const initQdrant = async () => {
    try {
        const collections = await qdrantClient.getCollections();
        const exists = collections.collections.some(c => c.name === PROMPT_COLLECTION);
        
        if (!exists) {
            await qdrantClient.createCollection(PROMPT_COLLECTION, {
                vectors: {
                    size: 768, // nomic-embed-text dimension
                    distance: "Cosine",
                },
            });
            console.log(`Qdrant collection '${PROMPT_COLLECTION}' created.`);
        } else {
            console.log(`Qdrant collection '${PROMPT_COLLECTION}' already exists.`);
        }
    } catch (error) {
        console.error("Qdrant init error:", error);
    }
};

export const mongoIdToUuid = (mongoId) => {
    const padded = mongoId.toString().padStart(32, '0');
    return [
        padded.substring(0, 8),
        padded.substring(8, 12),
        padded.substring(12, 16),
        padded.substring(16, 20),
        padded.substring(20, 32)
    ].join('-');
};

export const upsertPromptToQdrant = async (promptId, embedding, payload = {}) => {
    try {
        const id = mongoIdToUuid(promptId);
        await qdrantClient.upsert(PROMPT_COLLECTION, {
            wait: true,
            points: [
                {
                    id,
                    vector: embedding,
                    payload: {
                        mongoId: promptId.toString(),
                        ...payload
                    }
                }
            ]
        });
    } catch (error) {
        console.error("Upsert to Qdrant failed:", error);
    }
};

export const deletePromptFromQdrant = async (promptId) => {
    try {
        const id = mongoIdToUuid(promptId);
        await qdrantClient.delete(PROMPT_COLLECTION, {
            points: [id],
        });
    } catch (error) {
         console.error("Delete from Qdrant failed:", error);
    }
}

export const searchSimilarPrompts = async (queryVector, limit = 50, filter = null) => {
    try {
        const result = await qdrantClient.search(PROMPT_COLLECTION, {
            vector: queryVector,
            limit,
            filter, 
            with_payload: true,
            with_vector: false,
        });
        return result; // array of points: { id, version, score, payload }
    } catch (error) {
        console.error("Qdrant search failed:", error);
        return [];
    }
};

export default qdrantClient;
