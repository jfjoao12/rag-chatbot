import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env if .env.local is missing

async function run(): Promise<void> {
    const { ingestDocuments } = await import("../src/ai/services/ingestion.service");

    await ingestDocuments();
    process.exit(0);
}

run().catch((error: unknown) => {
    console.error("ERROR: ", error);
    process.exit(1);
});
