import { MemorySaver } from "@langchain/langgraph";
import { createAgent, SystemMessage } from "langchain";
import { AGENT_CONFIG } from "../config/agent.config";
import { prompts } from "../prompts/agent.prompts";
import { createChatModel } from "../services/llm.service";
import { getTools } from "../tools";

const checkpointer = new MemorySaver();

export async function createAgentGraph() {
    const tools = await getTools();
    const systemPrompt = new SystemMessage(
        `
            ${prompts.house}\n
        `,
    );

    return createAgent({
        model: createChatModel(AGENT_CONFIG.provider),
        tools,
        systemPrompt,
        checkpointer,
    });
}
