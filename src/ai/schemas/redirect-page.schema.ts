import * as z from "zod";

export const redirectPageSchema = z.object({
    path: z.string().describe("Absolute path like /projects or /about"),
});
