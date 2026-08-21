import * as z from "zod";

export const retrieveSchema = z.object({ query: z.string() });
