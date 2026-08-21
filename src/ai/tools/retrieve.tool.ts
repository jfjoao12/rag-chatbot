import { tool, type ToolRuntime } from "@langchain/core/tools";
import { retrieveSchema } from "../schemas/retrieve.schema";
import { retrieveDocuments } from "../services/retrieval.service";

export function createRetrieveTool() {
    return tool(
        async ({ query }, runtime: ToolRuntime) => {
            runtime.writer?.({
                type: "toolMessageUpdate",
                message: "Fetching documents",
                toolCallId: runtime.toolCallId,
            });

            console.log("TOOL CALL ID?: ", runtime.toolCallId);

            return retrieveDocuments(query);
        },
        {
            name: "retrieve",
            description: "Retrieve information related to Joao",
            schema: retrieveSchema,
            responseFormat: "content_and_artifact",
        },
    );
}
