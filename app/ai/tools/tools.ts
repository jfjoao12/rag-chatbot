"use server"

import { vectorStore } from "@/app/rag/rag";
import { tool } from "@langchain/core/tools";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import * as z from "zod";

const retrieveSchema = z.object({ query: z.string() });
export async function getTools(): Promise<any[]> {
    return [
        tool(
            async ({ path }) => {
                return {
                    type: "redirect",
                    path,
                };
            },
            {
                name: "redirectPage",
                description: "Request navigation to a page",
                schema: z.object({
                    path: z.string().describe("Absolute path like /projects or /about"),
                }),
            }
        ),
        tool(
            async ({ query }, config?: LangGraphRunnableConfig) => {
                const extendedConfig = config as any;

                config?.writer?.({
                    type: "toolMessageUpdate",
                    message: "Fetching documents",
                    toolCallId: extendedConfig.toolCallId, // Force it with 'as any'
                });

                console.log("TOOL CALL ID?: ", extendedConfig.toolCallId)

                const retrievedDocs = await vectorStore.similaritySearch(query);
                const serialized = retrievedDocs
                    .map(
                        (doc) => `Source ${doc.metadata.source}\n: ${doc.pageContent}`
                    )
                    .join("\n");
                return [serialized, retrievedDocs];
            },
            {
                name: "retrieve",
                description: "Retrieve information related to Joao",
                schema: retrieveSchema,
                responseFormat: "content_and_artifact",

            }
        ),
        tool(
            async (_input, config?: LangGraphRunnableConfig) => {

                const extendedConfig = config as any;
                config?.writer?.({
                    type: "toolMessageUpdate",
                    message: "Fetching time",
                    toolCallId: extendedConfig.toolCallId, // Force it with 'as any'
                });

                console.log("TOOL CALL ID?: ", extendedConfig.toolCallId)
                return new Date().toLocaleString();
            },
            {
                name: "getCurrentTime",
                description: "Returns the current server time",
                schema: z.object({}),
            }
        )
    ]
}
