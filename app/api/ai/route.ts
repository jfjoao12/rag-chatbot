import { MemorySaver } from "@langchain/langgraph";
import { NextRequest } from "next/server";
import { runAgent } from "@/app/ai/agent";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // if (!body.apiKey) {
        //     return new Response(
        //         JSON.stringify({ error: "Missing API key" }),
        //         { status: 400, headers: { "Content-Type": "application/json" } }
        //     );
        // }

        // Get the agent stream
        return runAgent(body);
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Internal server error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
