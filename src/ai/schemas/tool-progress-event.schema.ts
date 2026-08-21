import * as z from "zod";

export const toolProgressEventSchema = z.object({
    type: z.enum(["toolMessageUpdate"]).optional(),
    message: z.string().optional(),
    data: z.record(z.unknown()).optional(),
}).passthrough();

export const customEventSchema = toolProgressEventSchema;
