import type { ToolCall, ToolMessage } from "@langchain/core/messages";

/**
 * Represents the state of a tool call in the chat interface.
 *
 * This interface encapsulates all information needed to display a tool call bubble,
 * including the original tool call, its result (if available), and metadata about
 * its execution state.
 */
export interface ToolCallState {
    /**
     * The tool call object containing the tool name and arguments.
     * This is the request made by the AI agent to execute a tool.
     */
    toolCall: ToolCall;

    /**
     * The tool message containing the result of the tool execution.
     * This is undefined while the tool is still executing.
     */
    toolMessage?: ToolMessage;

    /**
     * Whether this tool call failed due to an error.
     * When true, the component will display error styling.
     */
    errored?: boolean;
}
