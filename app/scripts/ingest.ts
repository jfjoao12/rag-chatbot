import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env if .env.local is missing
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/classic/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import prisma from "../lib/prisma-client";

async function run() {
    const { vectorStore } = await import("../rag/rag");
    console.log("Loading Documents")

    // 1. Load docs form a folder named 'documents' in root
    const loader = new DirectoryLoader("./app/rag/documents", {
        ".txt": (path) => new TextLoader(path),
        ".pdf": (path) => new PDFLoader(path, { splitPages: false }),
    })

    const docs = await loader.load();

    // 2. Split text into manageable chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 50,
    })

    const splitDocs = await splitter.splitDocuments(docs)

    console.log(`Split into ${splitDocs.length} chunks. Embedding and storing...`)

    await prisma.$executeRaw`TRUNCATE TABLE "documents"`;


    await vectorStore.addDocuments(splitDocs)

    console.log("Ingestion Complete!")

    process.exit(0)
}


run().catch((err => {
    console.error("ERROR: ", err)
    process.exit(1)
}))
