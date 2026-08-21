import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Pool } from "pg";

import {
    POSTGRES_POOL_CONFIG,
    VECTOR_CONFIG,
} from "../config/vector.config";

export type VectorDocument = Document<Record<string, unknown>>;

export interface VectorRepository {
    similaritySearch(query: string): Promise<VectorDocument[]>;
    addDocuments(documents: VectorDocument[]): Promise<void>;
}

export function createVectorRepository(
    embeddings: EmbeddingsInterface,
): VectorRepository {
    const pool = new Pool(POSTGRES_POOL_CONFIG);
    const vectorStore = new PGVectorStore(embeddings, {
        pool,
        ...VECTOR_CONFIG,
    });

    return {
        async similaritySearch(query) {
            return vectorStore.similaritySearch(query);
        },
        async addDocuments(documents) {
            await vectorStore.addDocuments(documents);
        },
    };
}
