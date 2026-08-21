import "dotenv/config";

export const EMBEDDING_CONFIG = {
    model: "gemini-embedding-001",
    apiKey: process.env.GOOGLE_API_KEY!,
} as const;

