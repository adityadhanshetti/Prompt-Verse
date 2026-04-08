import fetch from "node-fetch";
import { config } from "dotenv";
config();

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBEDDING_MODEL =
    process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text:latest";

export const generateEmbedding = async (text) => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                prompt: text,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        // console.log(data.embedding,"EMBEDDING");
        return data.embedding;
    } catch (error) {
        console.error("Embedding generation failed:", error);
        throw error;
    }
};
