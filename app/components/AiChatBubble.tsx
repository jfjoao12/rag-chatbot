'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircleIcon, X, SendHorizonalIcon, SendIcon } from 'lucide-react'
import UserChatMessage from './UserChatMessage'
import AiChatMessage from './AiChatMessage'
import { useStream, FetchStreamTransport } from "@langchain/langgraph-sdk/react";
import { useRouter } from 'next/navigation'
import { AIMessage, Message, ToolMessage } from '@langchain/core/messages'
import { ToolCallBubble, type ToolCallState } from "./ToolCall";

import { isAIMessage, isToolMessage, isHumanMessage, extractTextContent } from "../utils/ai_utils";
import { ToolCall } from 'langchain'

type ChatMessage = {
    role: 'user' | 'assistant'
    text: string
}

function getPageContext() {
    return {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        // simplistic scraping of main content to save tokens
        contentSummary: document.body.innerText.substring(0, 5000).replace(/\s+/g, ' ')
    };
}

export default function AiChatBubble() {
    const router = useRouter()
    const sessionIdRef = useRef<string | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [input, setInput] = useState('')
    const [redirect, setRedirect] = useState('')

    const redirectPage = (path: string) => {
        router.push(path)
    }

    if (!sessionIdRef.current) {
        sessionIdRef.current = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }

    const toggleChat = () => setIsChatOpen(open => !open)


    // const userMessage = input.trim()
    // if (!userMessage) return
    // setInput('')

    // // 1Add user message immediately
    // setMessages(prev => [
    //     ...prev,
    //     { role: 'user', text: userMessage },
    //     { role: 'assistant', text: "Generating" },
    // ])

    // const response = await runAgent(userMessage, sessionIdRef.current ?? 'default')

    // setMessages(prev => {
    //     const updated = [...prev]
    //     const lastIndex = updated.length - 1

    //     if (updated[lastIndex]?.role === 'assistant') {
    //         updated[lastIndex] = {
    //             role: 'assistant',
    //             text: response.response,
    //         }
    //     }

    //     return updated
    // })

    {/* STREAM METHOD */ }

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

    const stream = useStream({
        transport,
    });

    const toolCallsByMessage = useMemo(() => {
        const map = new Map<Message, ToolCallState[]>();

        stream.messages.forEach((message) => {
            // Only process AI messages (check both SDK format and LangChain Core format)
            if (!isAIMessage(message)) {
                return
            };

            const aiMessage = message as AIMessage;

            // Extract tool calls from AIMessage - check both direct property and kwargs
            let toolCalls: ToolCall[] = [];

            // Check for tool_calls directly on message (SDK format)
            if (aiMessage.tool_calls && Array.isArray(aiMessage.tool_calls)) {
                toolCalls = aiMessage.tool_calls as ToolCall[];
            }

            // Extract tool messages (responses) - find ToolMessage type messages
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
                const toolCallStates: ToolCallState[] = [];
                for (const toolCall of toolCalls) {
                    const toolMessage = toolMessages.find((tm) => {
                        return tm.tool_call_id === toolCall.id;
                    });

                    toolCallStates.push({
                        toolCall,
                        toolMessage,
                    });
                }
                map.set(message, toolCallStates);
            }
        });

        return map;
    }, [stream.messages]);


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



    // const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    //     if (event.key === 'Enter' && !event.shiftKey) {
    //         event.preventDefault()
    //         void sendMessage()
    //     }
    // }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isChatOpen && (
                <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/40" onClick={toggleChat} />
                    <div className="absolute right-6 bottom-20 top-6 w-96 max-w-full rounded-2xl bg-white/5 backdrop-blur-[2px] flex flex-col">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <span className="text-sm font-medium">AI Chat</span>
                            <button type="button" onClick={toggleChat} className="p-1">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex h-full flex-col justify-end gap-3">
                                <div className="flex flex-col gap-3">
                                    <AiChatMessage text="Hello! Feel free to ask anything about João." />
                                    {stream.messages
                                        .filter((m) => !isToolMessage(m) && m.content !== "")
                                        .map((message, index) => (
                                            isHumanMessage(message) ? (
                                                <UserChatMessage key={index} text={extractTextContent(message.content)} />
                                            ) : (
                                                <div key={index} className="flex flex-col gap-1">
                                                    <AiChatMessage text={extractTextContent(message.content)} />
                                                </div>
                                            )
                                        ))}
                                </div>

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
                                        placeholder="Ask me anything about João"
                                        className="w-full resize-none bg-transparent outline-none"
                                        rows={2}
                                    />
                                    <button
                                        type="submit"
                                        className="flex h-10 w-10 items-center justify-center rounded-full border-2"
                                        aria-label="Send message"
                                    >
                                        <SendHorizonalIcon />
                                    </button>
                                </form>
                                <div

                                    className="flex h-10 w-10 items-center justify-center rounded-full border-2"
                                    aria-label="Send message"
                                    onClick={() => router.push("/test")}
                                >
                                    <SendIcon />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            <div
                role="button"
                tabIndex={0}
                aria-label="Open AI chat"
                aria-expanded={isChatOpen}
                onClick={toggleChat}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleChat()}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <MessageCircleIcon />
            </div>
        </div >
    )

}
