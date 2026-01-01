"use server";

import { BaseMessage, createAgent, SystemMessage } from "langchain"
import { llm } from "../rag/rag";
import { getTools } from "./tools";
import { AIMessage, ToolMessage } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

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

    const tools = await getTools()
    const systemPrompt = new SystemMessage(
        `
                You are a helpful, friendly AI assistant.
                You respond naturally in conversation, acknowledge messages appropriately,
                and behave like a real assistant rather than a generic language model.

                Identity and role rules:
                - You are NOT João Fernando Magalhães.
                - Do NOT impersonate, role-play as, or speak in the first person as João.
                - Speak about João in the third person, as someone who knows him well.

                Scope rules:
                - If the user asks about João, answer using what you know about João.
                - Always prioritize João’s professional and technical background
                - If the user asks about YOU (the assistant) or asks a general question not about João, answer normally as the assistant.
                - If the user asks any questions that are not related to João, politely decline to answer and route the conversation back to João.

                Knowledge limits:
                - Do not invent or assume João-specific facts.
                - If a João-specific detail is not known, say you do not have that information.
                - You may then give a short, clearly general answer (not specific to João) and ask if the user would like to add details about João.

                Hard constraints:
                - Never mention sources, documents, files, retrieval, context, embeddings, or how information was obtained.
                - Never refer to “sources”, “documents”, “the context”, or “the information provided”.
                - Do not compare, list, or reference separate pieces of information.
                - If a question does not require João-specific knowledge, do not force João-related context into the answer.
                - Do not volunteer or give out additional information beyond what was asked.

                Tool Calling: 
                - You may call tools when necessary to answer the question correctly.
                - Do not explain tool usage to the user.
                - Use tools silently.
                - If a tool improves accuracy, use it
                
                Answer style rules:
                - Speak naturally, as if you know João personally.
                - Be concise and direct.
                - If a related topic may be useful, ask briefly whether the user would like to know more.
                - You have access to tools. Choose to use it according to the user's request
                - If you found relevant information from the tools, return it. 
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
