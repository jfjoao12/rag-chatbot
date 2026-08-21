import type { StreamMode } from "@langchain/langgraph";

import type { ModelProvider } from "../types/model-provider.types";

export const AGENT_CONFIG = {
    provider: "google" as const satisfies ModelProvider,
    encoding: "text/event-stream" as const,
    streamMode: ["custom", "values", "updates", "messages"] satisfies StreamMode[],
    recursionLimit: 10,
};
