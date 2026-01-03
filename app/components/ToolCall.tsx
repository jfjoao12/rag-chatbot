import type { ToolCall, ToolMessage } from "@langchain/core/messages";

import { extractTextContent } from "../utils/ai_utils";

/**
 * Represents the state of a tool call in the chat interface.
 *
 * This interface encapsulates all information needed to display a tool call bubble,
 * including the original tool call, its result (if available), and metadata about
 * its execution state.
 *
 * @interface ToolCallState
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

/**
 * Props for the ToolCallBubble component.
 *
 * @interface ToolCallBubbleProps
 */
export interface ToolCallBubbleProps {
  /**
   * The complete state of the tool call to display.
   * Contains the tool call request, result (if available), and execution metadata.
   */
  toolCallState: ToolCallState;
}

/**
 * A component that displays a tool call execution in the chat interface.
 *
 * This component renders a visual representation of a tool call made by an AI agent,
 * showing both the request (tool name and arguments) and the response (result or error).
 *
 * Features:
 * - Displays tool call name and formatted JSON arguments
 * - Shows tool execution result when available
 * - Visual error states with red styling
 * - Loading states ("Waiting for result...")
 * - Success/error status badges
 * - Dark mode support
 * - Responsive layout (max 80% width)
 *
 * The component handles three states:
 * 1. **Pending**: Tool call has been made but no result yet (shows "Waiting for result...")
 * 2. **Success**: Tool execution completed successfully (shows result with green badge)
 * 3. **Error**: Tool execution failed (shows error styling and message)
 *
 * Error detection:
 * - Checks `toolCallState.errored` flag
 * - Checks `toolMessage.status === "error"`
 * - Displays appropriate error messaging and styling
 *
 * @example
 * ```tsx
 * const toolCallState: ToolCallState = {
 *   toolCall: {
 *     name: "get_weather",
 *     args: { location: "San Francisco" },
 *     id: "call_123"
 *   },
 *   toolMessage: {
 *     content: "72°F and sunny",
 *     status: "success"
 *   },
 * };
 *
 * <ToolCallBubble toolCallState={toolCallState} />
 * ```
 *
 * @param props - The component props
 * @returns A visual bubble component displaying tool call information
 */
export function ToolCallBubble({ toolCallState }: ToolCallBubbleProps) {
  const toolMessageInfo = toolCallState.toolMessage;

  // Determine if this tool call errored by checking both the errored flag
  // and the tool message status
  const isErrored = toolCallState.errored || (toolMessageInfo && toolMessageInfo.status === "error");

  // Dynamic styling based on error state
  // Error state: red borders and light red background
  // Normal state: gray borders and white/dark gray background
  const borderColor = isErrored
    ? "border-red-400 dark:border-red-500"
    : "border-gray-300 dark:border-gray-700";
  const bgColor = isErrored
    ? "bg-red-50 dark:bg-red-900/20"
    : "bg-white dark:bg-gray-800";

  return (
    <div className="flex justify-start mt-4">
      <div className={`max-w-[80%] rounded-lg border-2 ${borderColor} ${bgColor} p-4`}>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Tool Call
              </span>
              <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                {toolCallState.toolCall.name}
              </span>
              {isErrored && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                  Errored
                </span>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(toolCallState.toolCall.args, null, 2)}
              </pre>
            </div>
          </div>

          {toolCallState.toolMessage && toolMessageInfo && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Result
                </span>
                {toolMessageInfo.status && (
                  <span className={`text-xs px-2 py-0.5 rounded ${toolMessageInfo.status === "success"
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                    }`}>
                    {toolMessageInfo.status}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {extractTextContent(toolMessageInfo.content)}
                </pre>
              </div>
            </div>
          )}

          {!toolCallState.toolMessage && !isErrored && (
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              Waiting for result...
            </div>
          )}

          {isErrored && !toolCallState.toolMessage && (
            <div className="text-xs text-red-600 dark:text-red-400 italic">
              Tool call failed due to an error
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
