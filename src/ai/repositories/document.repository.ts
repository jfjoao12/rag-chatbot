import prisma from "../../lib/prisma-client";

export async function clearDocuments(): Promise<void> {
    await prisma.$executeRaw`TRUNCATE TABLE "documents"`;
}
