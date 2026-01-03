"use server";

import { BaseMessage, createAgent, SystemMessage } from "langchain"
import { llm } from "../rag/rag";
import { getTools } from "./tools";
import { AIMessage, ToolMessage } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { prompts, contraints } from "./prompts";

type AgentResponse = {
    tools: string[],
    response: string,
    redirectPath?: string,
}

const checkpointer = new MemorySaver();

export default async function runAgent(
    inputMessage: string,
    sessionId = "default",
): Promise<AgentResponse> {

    // Fetching tools
    const tools = await getTools()

    // Fetching system prompt - will make it user selectable in the future
    // Personality prompt + contraints
    const systemPrompt = new SystemMessage(
        `
            ${prompts.house}\n
            ${contraints.default}
        `
    )

    const agent = createAgent({
        model: llm,
        tools: tools,
        systemPrompt,
        checkpointer,
    })

    let agentInputs = {
        messages: [{ role: "user", content: inputMessage }],
    }

    const threadId = sessionId.trim() || "default";
    const stream = await agent.stream(
        agentInputs, {
        streamMode: "values",
        configurable: { thread_id: threadId },
    }
    )

    const toolsUsed = new Set<string>()
    let final: AIMessage | null = null
    let redirectPath: string | undefined;

    for await (const step of stream) {
        const last = step.messages.at(-1) as BaseMessage | undefined;
        if (!last) continue;

        // ✅ Final AI response + tool calls
        if (AIMessage.isInstance(last)) {
            final = last;
            for (const tc of last.tool_calls ?? []) toolsUsed.add(tc.name);
        }

        // ✅ Tool OUTPUT (this is where your {type:"redirect", path:"..."} lives)
        if (ToolMessage.isInstance(last)) {
            // ToolMessage has: name, content
            if (last.name === "redirectPage") {
                let payload: any = last.content;

                // sometimes tool output arrives as a JSON string
                if (typeof payload === "string") {
                    try {
                        payload = JSON.parse(payload);
                    } catch {
                        // ignore
                    }
                }

                if (payload?.type === "redirect" && typeof payload.path === "string") {
                    redirectPath = payload.path;
                }
            }
        }

        console.log(last.content)
    }
    return {
        tools: [...toolsUsed],
        response: final?.text ?? "No response",
        redirectPath,
    };
}
