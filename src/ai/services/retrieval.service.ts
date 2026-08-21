import type { DocumentInterface } from "@langchain/core/documents";
import { vectorRepository } from "./vector-store.service";

export type RetrievalResult = [string, DocumentInterface[]];

export async function retrieveDocuments(query: string): Promise<RetrievalResult> {
    const retrievedDocs = await vectorRepository.similaritySearch(query);
    const serialized = retrievedDocs
        .map(
            (document) =>
                `Source ${document.metadata.source}\n: ${document.pageContent}`,
        )
        .join("\n");

    return [serialized, retrievedDocs];
}
