"use server";

import { BaseMessage, createAgent, SystemMessage } from "langchain"
import { llm } from "../rag/rag";
import { getTools } from "./tools";
import { AIMessage, ToolMessage } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { prompts } from "./prompts";
import { AIMessageChunk, Message } from "@langchain/core/messages";

type AgentResponse = {
    tools: string[],
    response: string,
    redirectPath?: string,
}

const checkpointer = new MemorySaver();

export default async function runAgent(
    inputMessage: string,
    sessionId = "default",
): Promise<String> {

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
        streamMode: "updates",
        configurable: { thread_id: threadId },
    })

    let finalText = "";
    const finalToolCalls: any[] = [];

    for await (const chunk of stream) {
        //console.log(JSON.stringify(chunk, null, 2));

        // Text tokens
        if (typeof chunk.content === "string") {
            finalText += chunk.content;
        }

        // Tool call deltas
        if (chunk.tool_calls?.length) {
            for (const tc of chunk.tool_calls) {
                finalToolCalls.push(tc);
            }
        }
    }

    const finalMessage = new AIMessage({
        content: finalText,
        tool_calls: finalToolCalls.length ? finalToolCalls : undefined,
    });
    console.log(JSON.stringify(finalMessage, null, 2))
    return JSON.stringify(finalMessage.content, null, 2);
    // for await (const step of stream) {
    //     const last = step.messages.at(-1) as BaseMessage | undefined;
    //     if (!last) continue;

    //     // ✅ Final AI response + tool calls
    //     if (AIMessage.isInstance(last)) {
    //         final = last;
    //         for (const tc of last.tool_calls ?? []) toolsUsed.add(tc.name);
    //     }

    //     // ✅ Tool OUTPUT (this is where your {type:"redirect", path:"..."} lives)
    //     if (ToolMessage.isInstance(last)) {
    //         // ToolMessage has: name, content
    //         if (last.name === "redirectPage") {
    //             let payload: any = last.content;

    //             // sometimes tool output arrives as a JSON string
    //             if (typeof payload === "string") {
    //                 try {
    //                     payload = JSON.parse(payload);
    //                 } catch {
    //                     // ignore
    //                 }
    //             }

    //             if (payload?.type === "redirect" && typeof payload.path === "string") {
    //                 redirectPath = payload.path;
    //             }
    //         }
    //     }

    //     console.log(last.content)
    // }
    // return {
    //     tools: [...toolsUsed],
    //     response: final?.text ?? "No response",
    //     redirectPath,
    // };
}
