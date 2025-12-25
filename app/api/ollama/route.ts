import { getTools } from "@/app/ai/tools";
import { MemorySaver } from "@langchain/langgraph";
import { createAgent, SystemMessage } from "langchain";
import { prompts } from "@/app/ai/prompts";
import ollama from "ollama";
import { llm } from "@/app/rag/rag";

const checkpointer = new MemorySaver();

export async function POST(request: Request) {
    const { inputMessage, sessionId = "default" } = await request.json()

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


    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                if (typeof chunk.content === "string") {
                    controller.enqueue(
                        encoder.encode(chunk.content)
                    );

                }
                console.log(chunk.content)
            }
            controller.close();
        },
    });

    return new Response(readableStream, {
        headers: { "Content-Type": "text/plain" },
    });
}
