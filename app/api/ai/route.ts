import { NextRequest } from "next/server";
import { runAgent } from "@/src/ai/agent";
import type { RunAgentOptions } from "@/src/ai/types/agent.types";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = (await request.json()) as RunAgentOptions;

        // if (!body.apiKey) {
        //     return new Response(
        //         JSON.stringify({ error: "Missing API key" }),
        //         { status: 400, headers: { "Content-Type": "application/json" } }
        //     );
        // }

        // Get the agent stream
        const stream = await runAgent(body);

        return new Response(stream, {
            headers: { "Content-Type": "text/event-stream" },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Internal server error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
