'use client'

import { MessageCircleIcon, X, SendHorizonalIcon } from 'lucide-react'
import type { AIMessage, Message, ToolMessage } from '@langchain/core/messages'
import { useStream, FetchStreamTransport } from '@langchain/langgraph-sdk/react'
import type { ToolCall } from 'langchain'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AiChatMessage from './AiChatMessage'
import UserChatMessage from './UserChatMessage'
import { customEventSchema } from '@/src/ai/schemas/tool-progress-event.schema'
import type { CustomEvent, CustomEventWithToolId } from '@/src/ai/types/streaming.types'
import type { ToolCallState } from '@/src/ai/types/tool-call.types'
import { extractTextContent, isAIMessage, isHumanMessage, isToolMessage } from '@/src/ai/utils/message.utils'

const resolveToolCallId = (event: CustomEvent, fallbackId: string | null) => {
    const eventWithToolId = event as CustomEventWithToolId
    return eventWithToolId.toolCallId ?? eventWithToolId.tool_call_id ?? fallbackId ?? 'unknown'
}

function AiLiveFeedback({ messageEvents }: { messageEvents: CustomEvent[] }) {
    return (
        <div className="space-y-1">
            {messageEvents.map((evt, evtIndex) => (
                <div
                    className="text-xs italic text-muted-foreground bg-white/5 px-2 py-1 rounded"
                    key={evtIndex}
                >
                    {evt.type && <span className="font-semibold">[{evt.type}]</span>} {evt.message ?? JSON.stringify(evt)}
                </div>
            ))}
        </div>
    )
}


export default function AiChatBubble() {
    const router = useRouter()
    const processedToolIds = useRef<Set<string>>(new Set())
    const activeToolCallIdRef = useRef<string | null>(null)

    // UI State
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [input, setInput] = useState('')

    // Custom Events State
    const [eventsByToolCallId, setEventsByToolCallId] =
        useState<Record<string, CustomEvent[]>>({})

    // Stream Transport Setup
    const transport = useMemo(() => {
        return new FetchStreamTransport({
            apiUrl: "/api/ai",
            onRequest: async (url: string, init: RequestInit) => {
                const customBody = JSON.stringify({
                    ...(JSON.parse(init.body as string) || {})
                });
                return {
                    ...init,
                    body: customBody,
                };
            },
        });
    }, []);

    // Stream with Custom Event Handler
    const stream = useStream({
        transport,
        onCustomEvent: (event) => {
            const payload = typeof event === "string" ? { message: event } : event;
            const parsed = customEventSchema.safeParse(payload);

            if (!parsed.success) return;

            const evt = parsed.data;
            const toolCallId = resolveToolCallId(evt, activeToolCallIdRef.current);

            setEventsByToolCallId(prev => ({
                ...prev,
                [toolCallId]: [...(prev[toolCallId] ?? []), evt],
            }));
        }
    });

    useEffect(() => {
        // find the newest AI message with tool calls and remember the last tool call id
        for (let i = stream.messages.length - 1; i >= 0; i--) {
            const msg = stream.messages[i];
            if (isAIMessage(msg)) {
                const ai = msg as AIMessage;
                const lastToolCall = ai.tool_calls?.[ai.tool_calls.length - 1];
                if (lastToolCall?.id) {
                    activeToolCallIdRef.current = lastToolCall.id;
                }
                break;
            }
        }
    }, [stream.messages]);

    // Handle redirect tool calls
    useEffect(() => {
        for (const message of stream.messages) {
            if (!isToolMessage(message)) continue
            const toolMessage = message as ToolMessage
            const toolCallId = toolMessage.tool_call_id

            if (!toolCallId || processedToolIds.current.has(toolCallId)) continue

            try {
                const content = typeof toolMessage.content === 'string'
                    ? JSON.parse(toolMessage.content)
                    : toolMessage.content

                if (content?.type === "redirect" && content?.path) {
                    processedToolIds.current.add(toolCallId)
                    router.push(content.path)
                }
            } catch (error) {
                // Silently handle non-JSON content
            }
        }
    }, [stream.messages, router])

    // Map tool calls to their respective AI messages
    // Nao to conseguindo usar essa porra tbm
    const toolCallsByMessage = useMemo(() => {
        const toolMessagesById = new Map<string, ToolMessage>()

        for (const message of stream.messages) {
            if (!isToolMessage(message)) continue
            const toolMessage = message as ToolMessage
            const toolCallId = toolMessage.tool_call_id

            if (!toolCallId || toolMessagesById.has(toolCallId)) continue
            toolMessagesById.set(toolCallId, toolMessage)
        }

        const map = new Map<Message, ToolCallState[]>()

        stream.messages.forEach((message) => {
            if (!isAIMessage(message)) return

            const aiMessage = message as AIMessage;
            let toolCalls: ToolCall[] = [];

            if (aiMessage.tool_calls && Array.isArray(aiMessage.tool_calls)) {
                toolCalls = aiMessage.tool_calls as ToolCall[];
            }

            // Build tool call states
            if (toolCalls.length > 0) {
                const toolCallStates: ToolCallState[] = toolCalls.map(toolCall => ({
                    toolCall,
                    toolMessage: toolCall.id ? toolMessagesById.get(toolCall.id) : undefined,
                }))
                map.set(message, toolCallStates)
            }
        })
        return map
    }, [stream.messages]);

    // Filter out tool messages from display
    // Nem isso
    const filteredMessages = useMemo(
        () => stream.messages.filter((m) => !isToolMessage(m)),
        [stream.messages]
    );

    // Message handlers
    const handleSend = useCallback(
        (message: string) => {
            if (!message.trim() || stream.isLoading) return;
            stream.submit({
                messages: [{ content: message, type: "human" }],
            });
        },
        [stream]
    );

    const submitInput = useCallback(() => {
        handleSend(input)
        setInput('')
    }, [handleSend, input])

    const toggleChat = () => setIsChatOpen(open => !open)

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isChatOpen && (
                <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40" onClick={toggleChat} />

                    {/* Chat Container */}
                    <div className="absolute right-6 bottom-20 top-6 w-md rounded-2xl bg-white/5 backdrop-blur-[2px] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <span className="text-sm font-medium">AI Chat</span>
                            <button type="button" onClick={toggleChat} className="p-1 hover:opacity-70">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex h-full flex-col justify-end gap-3">
                                <div className="flex flex-col gap-3 ">
                                    {/* Initial greeting */}
                                    <AiChatMessage text="Hello! Feel free to ask anything about João." />

                                    {/* Message list */}
                                    {filteredMessages.map((message, index) => {
                                        // User messages
                                        if (isHumanMessage(message)) {
                                            return (
                                                <UserChatMessage
                                                    key={index}
                                                    text={extractTextContent(message.content)}
                                                />
                                            )
                                        }

                                        // AI messages
                                        if (isAIMessage(message)) {
                                            const text = extractTextContent(message.content)
                                            const toolCallStates = toolCallsByMessage.get(message);
                                            const hasToolCalls = toolCallStates && toolCallStates.length > 0;

                                            const eventsForThisAiMessage =
                                                toolCallStates?.flatMap(s => s.toolCall.id ? eventsByToolCallId[s.toolCall.id] ?? [] : []) ?? [];

                                            return (
                                                <div key={message.id ?? index} className="flex flex-col gap-1">
                                                    {hasToolCalls && eventsForThisAiMessage.length > 0 && (
                                                        <AiLiveFeedback messageEvents={eventsForThisAiMessage} />
                                                    )}
                                                    {text && <AiChatMessage text={text} />}
                                                </div>
                                            );
                                        }
                                        return null
                                    })}
                                </div>

                                {/* Input Form */}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        submitInput();
                                    }}
                                    className="flex items-end gap-2 rounded-lg border bg-white/5 p-2"
                                >
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                submitInput();
                                            }
                                        }}
                                        placeholder="Ask me anything about João"
                                        className="w-full resize-none bg-transparent outline-none"
                                        rows={2}
                                        disabled={stream.isLoading}
                                    />
                                    <button
                                        type="submit"
                                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 hover:bg-white/10 disabled:opacity-50"
                                        aria-label="Send message"
                                        disabled={stream.isLoading || !input.trim()}
                                    >
                                        <SendHorizonalIcon />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                type="button"
                aria-label="Open AI chat"
                aria-expanded={isChatOpen}
                onClick={toggleChat}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <MessageCircleIcon />
            </button>
        </div>
    )
}
