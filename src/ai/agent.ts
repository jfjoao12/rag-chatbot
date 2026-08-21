import { AGENT_CONFIG } from "./config/agent.config";
import { createAgentGraph } from "./graph/graph";
import type { RunAgentOptions } from "./types/agent.types";

export async function runAgent(options: RunAgentOptions) {
    const agent = await createAgentGraph();

    return agent.stream(options.input, {
        encoding: AGENT_CONFIG.encoding,
        streamMode: [...AGENT_CONFIG.streamMode],
        configurable: options.config.configurable,
        recursionLimit: AGENT_CONFIG.recursionLimit,
    });
}
