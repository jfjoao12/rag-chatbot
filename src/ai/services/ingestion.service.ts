import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/classic/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ingestionConfig } from "../config/ingestion.config";
import { clearDocuments } from "../repositories/document.repository";
import { vectorRepository } from "./vector-store.service";

export async function ingestDocuments(): Promise<void> {
    console.log("Loading Documents");

    const loader = new DirectoryLoader(ingestionConfig.documentsDirectory, {
        ".txt": (path) => new TextLoader(path),
        ".pdf": (path) => new PDFLoader(path, { splitPages: false }),
    });

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: ingestionConfig.chunkSize,
        chunkOverlap: ingestionConfig.chunkOverlap,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    console.log(`Split into ${splitDocs.length} chunks. Embedding and storing...`);

    await clearDocuments();
    await vectorRepository.addDocuments(splitDocs);

    console.log("Ingestion Complete!");
}
