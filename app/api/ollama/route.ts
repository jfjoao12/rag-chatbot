import { NextRequest, NextResponse } from "next/server";
import { vectorStore, llm } from "@/app/lib/rag";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";

export const maxDuration = 60; // Allow longer timeouts for local LLMs

export async function POST(req: NextRequest) {
    try {
        const { question } = await req.json();

        if (typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json({ error: "Missing question" }, { status: 400 });
        }

        // 1. Retrieve context
        const retriever = vectorStore.asRetriever({
            k: 6, // fetch a few more chunks to improve recall
            searchType: "mmr",
            searchKwargs: { fetchK: 20 }, // wider candidate pool for MMR
        });

        const formatDocs = (
            docs: Array<{ pageContent: string; metadata?: Record<string, unknown> }>
        ) =>
            docs.length
                ? docs
                    .map((doc, idx) => {
                        const source = doc.metadata?.source ?? "unknown";
                        return `Source ${idx + 1} (${source}):\n${doc.pageContent}`;
                    })
                    .join("\n\n---\n\n")
                : "No relevant context found.";

        // 2. Define the Prompt
        const template = `
You are Simpli, an AI assistant that represents João on his portfolio site.
- Use only the Context to answer the Question.
- If the context is empty or does not cover the request, say you are not sure based on the available info.
- Keep replies concise, professional, and welcoming to follow-ups.
- Do not volunteer extra information beyond what was asked.
- If explicitly asked about yourself, you may state you are an AI and mention your model details.
- Never mention where you are grabbing the information from.

Context:
{context}

Question:
{question}

Answer:
`;
        const prompt = ChatPromptTemplate.fromTemplate(template);

        // 3. Define the Chain
        // This sequence:
        // a. Takes the input question
        // b. Retrieve docs & Format them into a string
        // c. Pass context + question to prompt
        // d. Pass prompt to Ollama
        // e. Parse output as string
        const chain = RunnableSequence.from([
            {
                context: retriever.pipe(formatDocs),
                question: new RunnablePassthrough(),
            },
            prompt,
            llm,
            new StringOutputParser(),
        ]);

        // 4. Stream Response
        // We stream the chunks so the user sees text appearing immediately
        const stream = await chain.stream(question);

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
