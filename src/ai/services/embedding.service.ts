import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { EMBEDDING_CONFIG } from "../config/embedding.config";

export const embeddings = new GoogleGenerativeAIEmbeddings(EMBEDDING_CONFIG);

export function getEmbeddings(): GoogleGenerativeAIEmbeddings {
    return embeddings;
}

