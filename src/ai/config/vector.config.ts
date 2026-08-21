import "dotenv/config";

import type { PGVectorStoreArgs } from "@langchain/community/vectorstores/pgvector";
import type { PoolConfig } from "pg";

type VectorStoreSchemaConfig = Pick<PGVectorStoreArgs, "tableName" | "columns">;

export const POSTGRES_POOL_CONFIG = {
    host: "127.0.0.1",
    port: 5432,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
} satisfies PoolConfig;

export const VECTOR_CONFIG = {
    tableName: "documents",
    columns: {
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
    },
} as const satisfies VectorStoreSchemaConfig;

