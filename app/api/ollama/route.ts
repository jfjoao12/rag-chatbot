import { NextRequest, NextResponse } from "next/server";
import { vectorStore, llm, toolAwareLLM } from "@/app/lib/rag";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import {
    RunnableSequence,
    RunnablePassthrough,
    RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import { ToolCall } from "@langchain/core/messages";




export const maxDuration = 60; // Allow longer timeouts for local LLMs

const histories = new Map<string, InMemoryChatMessageHistory>();

export async function POST(req: NextRequest) {
    try {
        const { question, sessionId } = await req.json();

        if (typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json({ error: "Missing question" }, { status: 400 });
        }

        // 1. Retrieve context
        const retriever = vectorStore.asRetriever({
            k: 12, // fetch a few more chunks to improve recall
            searchType: "mmr",
            searchKwargs: { fetchK: 20 }, // wider candidate pool for MMR
        });

        const formatDocs = (
            docs: Array<{ pageContent: string }>
        ) =>
            docs.length
                ? docs.map(doc => doc.pageContent).join("\n\n")
                : "";

        // 2. Define the Prompt with chat history support
        const prompt = ChatPromptTemplate.fromMessages([
            [
                "system",
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
                `
            ],

            new MessagesPlaceholder("history"),
            [
                "human",
                `Context:
                {context}

                Question:
                {question}

                Answer:`,
            ],
        ]);

        // 3. Define the Chain with in-memory chat history per session
        const retrievalChain = RunnableSequence.from([
            (input: { question: string }) => input.question,
            retriever,
            formatDocs,
        ]);

        const baseChain = RunnableSequence.from([
            RunnablePassthrough.assign({
                context: retrievalChain,
            }),
            prompt,
            toolAwareLLM,
            new StringOutputParser(),
        ]);

        const chain = new RunnableWithMessageHistory({
            runnable: baseChain,
            getMessageHistory: async (id: string) => {
                if (!histories.has(id)) {
                    histories.set(id, new InMemoryChatMessageHistory());
                }
                return histories.get(id)!;
            },
            inputMessagesKey: "question",
            historyMessagesKey: "history",
        });

        // 4. Stream Response
        // We stream the chunks so the user sees text appearing immediately
        const stream = await chain.stream(
            { question },
            { configurable: { sessionId: sessionId ?? "default" } },
        );

        const responseStream = new ReadableStream({
            async pull(controller) {
                for await (const chunk of stream) {
                    controller.enqueue(chunk);
                }
                controller.close();
            },
        });

        return new NextResponse(responseStream, {
            headers: { "Content-Type": "text/plain" },
        });

    } catch (error) {
        console.error(error);
        const status = error ?? 500;
        const message = error ?? "Internal Server Error";
        return NextResponse.json({ error: message });
    }
}
