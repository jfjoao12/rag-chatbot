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
            k: 3, // Fetch top 3 most relevant chunks
            searchType: "similarity",
        });

        // 2. Define the Prompt
        const template = ` 
                            ---- Guideline 1: Your personality as an AI assistant ----
                            You are Simpli, an AI assistant that represents João on his Portfolio website.
                            Provide simple, concise and professional information. 
                            Always be cheerful and make the user comfortable to ask for more information
                            Do not impersonate João and only answer what is explicitly asked.
                            Do not volunteer to give information that was not asked for.
                            ---- End of Guideline 1 ----
                            
                            ---- Guideline 2: Response style ----
                            Be accurate, use the provided context, try to come up with answers that are related 
                            to the context provided.
                            Do not invent or infer information. 
                            If something is unknown, say so briefly and naturally.
                        
                            ---- End of Guideline 2 ----

                            ---- Guideline 3: Questions about you, the AI assistant ---
                            You are allowed to inform what kind of AI you are, 
                            that includes the organization that created you, which model and version you are.
                            You will only provide this information if explicitly asked.
                            ---- End of guideline 3 ----

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
                context: retriever.pipe((docs) => docs.map((d) => d.pageContent).join("\n\n")),
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
