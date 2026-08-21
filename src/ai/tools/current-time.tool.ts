import { tool, type ToolRuntime } from "@langchain/core/tools";
import { currentTimeSchema } from "../schemas/current-time.schema";

export function createCurrentTimeTool() {
    return tool(
        async (_input, runtime: ToolRuntime) => {
            runtime.writer?.({
                type: "toolMessageUpdate",
                message: "Fetching time",
                toolCallId: runtime.toolCallId,
            });

            console.log("TOOL CALL ID?: ", runtime.toolCallId);

            return new Date().toLocaleString();
        },
        {
            name: "getCurrentTime",
            description: "Returns the current server time",
            schema: currentTimeSchema,
        },
    );
}
