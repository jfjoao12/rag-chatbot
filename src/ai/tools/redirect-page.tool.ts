import { tool } from "@langchain/core/tools";
import { redirectPageSchema } from "../schemas/redirect-page.schema";

export function createRedirectPageTool() {
    return tool(
        async ({ path }) => ({
            type: "redirect",
            path,
        }),
        {
            name: "redirectPage",
            description: "Request navigation to a page",
            schema: redirectPageSchema,
        },
    );
}
