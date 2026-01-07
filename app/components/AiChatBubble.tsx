'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircleIcon, X, SendHorizonalIcon } from 'lucide-react'
import UserChatMessage from './UserChatMessage'
import AiChatMessage from './AiChatMessage'
import { useStream, FetchStreamTransport } from "@langchain/langgraph-sdk/react";
import { useRouter } from 'next/navigation'
import { AIMessage, Message, ToolMessage } from '@langchain/core/messages'
import { type ToolCallState } from "./ToolCall";
import * as z from "zod";
import { isAIMessage, isToolMessage, isHumanMessage, extractTextContent } from "../utils/ai_utils";
import { ToolCall } from 'langchain'
import { customEventSchema } from '../ai/tools/tools_utils'

export default function AiChatBubble() {
    const router = useRouter()
    const sessionIdRef = useRef<string | null>(null)
    const processedToolIds = useRef<Set<string>>(new Set());

    // UI State
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [input, setInput] = useState('')

    // Custom Events State
    const [customEvents, setCustomEvents] = useState<z.infer<typeof customEventSchema>[]>([]);
    const [messageEvents, setMessageEvent] = useState<z.infer<typeof customEventSchema>[]>([]);


    // Generate session ID once
    if (!sessionIdRef.current) {
        sessionIdRef.current = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }

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
        onCustomEvent: (event, options) => {
            console.log("EVENT:", event);
            console.log("OPTIONS:", options);
            const payload = typeof event === "string" ? { message: event } : event;
            const parsed = customEventSchema.safeParse(payload);



            if (!parsed.success) {
                setCustomEvents((prev) => [...prev, { message: JSON.stringify(payload) }]);
                return;
            }
            setMessageEvent([parsed.data]);
            setCustomEvents((prev) => [...prev, parsed.data]);
        },
    });


    // Handle redirect tool calls
    useEffect(() => {
        stream.messages.forEach((message) => {
            const toolMessage = message as ToolMessage

            if (processedToolIds.current.has(toolMessage.tool_call_id)) {
                return
            }

            try {
                const content = typeof toolMessage.content === 'string'
                    ? JSON.parse(toolMessage.content)
                    : toolMessage.content

                if (content?.type === "redirect" && content?.path) {
                    processedToolIds.current.add(toolMessage.tool_call_id)
                    router.push(content.path);
                }
            } catch (error) {
                // Silently handle non-JSON content
            }
        })
    }, [stream.messages, router])

    // Map tool calls to their respective AI messages
    const toolCallsByMessage = useMemo(() => {
        const map = new Map<Message, ToolCallState[]>();

        stream.messages.forEach((message) => {
            if (!isAIMessage(message)) return;

            const aiMessage = message as AIMessage;
            let toolCalls: ToolCall[] = [];

            if (aiMessage.tool_calls && Array.isArray(aiMessage.tool_calls)) {
                toolCalls = aiMessage.tool_calls as ToolCall[];
            }

            // Find corresponding tool messages
            const toolMessages: ToolMessage[] = [];
            for (const msg of stream.messages) {
                if (isToolMessage(msg)) {
                    const toolMessage = msg as ToolMessage;
                    const toolCallId = toolMessage.tool_call_id;

                    if (toolCallId && toolCalls.some((tc) => tc.id === toolCallId)) {
                        toolMessages.push(msg as ToolMessage);
                    }
                }
            }

            // Build tool call states
            if (toolCalls.length > 0) {
                const toolCallStates: ToolCallState[] = toolCalls.map(toolCall => ({
                    toolCall,
                    toolMessage: toolMessages.find(tm => tm.tool_call_id === toolCall.id),
                }));
                map.set(message, toolCallStates);
            }
        });
        return map;
    }, [stream.messages]);

    // Filter out tool messages from display
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

    const handleInputSubmit = useCallback(
        (message: string) => {
            handleSend(message);
        },
        [handleSend]
    );

    const toggleChat = () => setIsChatOpen(open => !open)

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isChatOpen && (
                <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40" onClick={toggleChat} />

                    {/* Chat Container */}
                    <div className="absolute right-6 bottom-20 top-6 w-[20%] rounded-2xl bg-white/5 backdrop-blur-[2px] flex flex-col">
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
                                            const toolCallStates = toolCallsByMessage.get(message)
                                            const hasToolCalls = toolCallStates && toolCallStates.length > 0

                                            return (
                                                <div key={index} className="flex flex-col gap-1">
                                                    {/* Tool status messages */}
                                                    {hasToolCalls && (
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
                                                    )}

                                                    {/* AI response */}
                                                    {text && <AiChatMessage key={index} text={text} />}
                                                </div>
                                            )
                                        }
                                        return null
                                    })}
                                </div>

                                {/* Input Form */}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleInputSubmit(input);
                                        setInput("");
                                    }}
                                    className="flex items-end gap-2 rounded-lg border bg-white/5 p-2"
                                >
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleInputSubmit(input);
                                                setInput("");
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