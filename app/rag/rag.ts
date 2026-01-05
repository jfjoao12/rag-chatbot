import "dotenv/config";

import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector"
import { Pool } from "pg"




// 1. Setup The Postgres Pool
export const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
})

// 2. Setup Ollama Embeddings (for convering text to numbers)
// export const embeddings = new OllamaEmbeddings({
//     dimensions: 3072,
//     model: "qwen3-embedding:8b",
//     baseUrl: "http://localhost:11434",
// })

export const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY!,
    model: "gemini-embedding-001",

})

// 3. Setup Ollama LLM (for generating answers)
// export const llm = new ChatOllama({
//     baseUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
//     model: process.env.OLLAMA_CHAT_MODEL ?? "qwen3:8b-largercontext",
//     temperature: 0.2,
//     think: false
// })

export const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    temperature: 0,
    maxRetries: 2,
    streaming: true,
    apiKey: process.env.GOOGLE_API_KEY!
});

// export const toolAwareLLM = llm.bindTools([
//     getCurrentTime,
// ]);

// 4. Configure Vector Store
const pgVectorConfig = {
    pool,
    tableName: "documents", // actual lowercase name created by Prisma
    columns: {
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
    },
};

export const vectorStore = new PGVectorStore(embeddings, pgVectorConfig)