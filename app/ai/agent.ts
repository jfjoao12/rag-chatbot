"use server";

import { BaseMessage, createAgent, SystemMessage, AIMessage } from "langchain"
import { llm } from "../rag/rag";
import { getTools } from "./tools/tools";
import { LangGraphRunnableConfig, MemorySaver } from "@langchain/langgraph";
import { prompts } from "./prompts";

type AgentResponse = {
    tools: string[],
    response: string,
    redirectPath?: string,
}

const checkpointer = new MemorySaver();

export async function runAgent(options: { input: Record<string, unknown>; config: LangGraphRunnableConfig }) {
    // Fetching tools
    const tools = await getTools()

    // Fetching system prompt - will make it user selectable in the future
    // Personality prompt + contraints
    const systemPrompt = new SystemMessage(
        `
            ${prompts.house}\n
        `
    )

    const agent = createAgent({
        model: llm("google"),
        tools: tools,
        systemPrompt,
        checkpointer,
    })


    const stream = await agent.stream(options.input as {
        messages: BaseMessage[];
    }, {
        encoding: "text/event-stream",
        streamMode: ["custom", "values", "updates", "messages"],
        configurable: options.config.configurable,
        recursionLimit: 10,
    });

    return new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
    });

}
