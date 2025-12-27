import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama"
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector"
import { Pool } from "pg"

// 1. Setup The Postgres Pool
const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "jfjoao",
    password: "senha123",
    database: "portfolio"
})

// 2. Setup Ollama Embeddings (for convering text to numbers)
export const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text-v2-moe:latest",
    baseUrl: "http://localhost:11434"
})

// 3. Setup Ollama LLM (for generating answers)
export const llm = new ChatOllama({
    model: "llama3.2:latest",
    temperature: 0,
    baseUrl: "http://localhost:11434",
})

// 4. Configure Vector Store
const pgVectorConfig = {
    pool: pool,
    tableName: "documents",
    columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
    }
}

export const vectorStore = new PGVectorStore(embeddings, pgVectorConfig)