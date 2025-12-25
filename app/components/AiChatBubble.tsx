'use client'

import { useRef, useState } from 'react'
import { MessageCircleIcon, X, SendHorizonalIcon, SendIcon } from 'lucide-react'
import UserChatMessage from './UserChatMessage'
import AiChatMessage from './AiChatMessage'
import runAgent from '../ai/agent'
import { useRouter } from 'next/navigation'

type ChatMessage = {
    role: 'user' | 'assistant'
    text: string
}

export default function AiChatBubble() {
    const router = useRouter()
    const sessionIdRef = useRef<string | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<ChatMessage[]>([])

    if (!sessionIdRef.current) {
        sessionIdRef.current = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }

    const toggleChat = () => setIsChatOpen(open => !open)

    const sendMessage = async () => {

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

        // if (response.redirectPath) {
        //     router.push(response.redirectPath)
        // }

        {/* STREAM METHOD */ }
        const userMessage = input.trim()

        if (!userMessage) return
        setInput('')

        // 1Add user message immediately
        setMessages(prev => [
            ...prev,
            { role: 'user', text: userMessage },
            { role: 'assistant', text: "Generating" },
        ])

        // 2️⃣ Call the route
        const response = await fetch("/api/ollama", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputMessage: userMessage }),
        })

        if (!response.body) return

        // 3️⃣ Stream the response
        const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader()

        let accumulatedText = ""

        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            accumulatedText += value ?? ""

            // 4️⃣ Update only the LAST assistant message
            setMessages(prev => {
                const updated = [...prev]
                const lastIndex = updated.length - 1

                if (updated[lastIndex]?.role === 'assistant') {
                    updated[lastIndex] = {
                        role: 'assistant',
                        text: accumulatedText,
                    }
                }

                return updated
            })
        }

    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void sendMessage()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void sendMessage()
        }
    }

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
                                    {messages.map((message, index) =>
                                        message.role === 'user' ? (
                                            <UserChatMessage key={index} text={message.text} />
                                        ) : (
                                            <AiChatMessage key={index} text={message.text} />
                                        )
                                    )}
                                </div>

                                <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-lg border bg-white/5 p-2">
                                    <textarea
                                        name="message"
                                        id="message"
                                        placeholder="Ask me anything about João"
                                        value={input}
                                        onChange={event => setInput(event.target.value)}
                                        onKeyDown={handleKeyDown}
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
