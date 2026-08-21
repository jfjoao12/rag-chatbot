import { createCurrentTimeTool } from "./current-time.tool";
import { createRedirectPageTool } from "./redirect-page.tool";
import { createRetrieveTool } from "./retrieve.tool";

export async function getTools() {
    return [
        createRedirectPageTool(),
        createRetrieveTool(),
        createCurrentTimeTool(),
    ];
}
