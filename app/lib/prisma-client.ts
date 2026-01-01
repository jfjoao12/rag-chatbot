
import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/src/generated/prisma/client';
/**
 * PostgreSQL adapter for Prisma using connection string from environment variables.
 * Ensures Prisma uses the correct database connection.
 */
const adapter = new PrismaPg({
    host: "localhost",
    port: 5432,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
});

// Next.js hot-reload protection: extend globalThis
declare global {
    var prisma: PrismaClient | undefined;
}

// Use existing global client or create a new one
export const prisma =
    globalThis.prisma ??
    new PrismaClient({
        adapter,
    });

// Save client to global in development (avoids re-instantiation)
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

export default prisma;
