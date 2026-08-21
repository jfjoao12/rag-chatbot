import type { BaseMessage } from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

export interface AgentInput extends Record<string, unknown> {
    messages: BaseMessage[];
}

export interface RunAgentOptions {
    input: AgentInput;
    config: LangGraphRunnableConfig;
}
