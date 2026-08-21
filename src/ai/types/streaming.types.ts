import type * as z from "zod";

import type { toolProgressEventSchema } from "../schemas/tool-progress-event.schema";

export type CustomEvent = z.infer<typeof toolProgressEventSchema>;

export type CustomEventWithToolId = CustomEvent & {
    toolCallId?: string;
    tool_call_id?: string;
};
