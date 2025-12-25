'use client'

import { useState } from 'react'
import { MessageCircleIcon, X, SendHorizonalIcon } from 'lucide-react'
import UserChatMessage from './UserChatMessage'
import AiChatMessage from './AiChatMessage'

type ChatMessage = {
    role: 'user' | 'assistant'
    text: string
}

export default function AiChatBubble() {
    const [openChat, setOpenChat] = useState(false)
    const [text, setText] = useState("")
    const [aiText, setAiText] = useState("Loading...")
    const [messages, setMessages] = useState<ChatMessage[]>([])

    const toggleChat = () => setOpenChat(open => !open)

    const handleSend = async () => {
        if (!text.trim()) return

        const userMessage = text
        setText("")

        // 1️⃣ Add user message immediately
        setMessages(prev => [
            ...prev,
            { role: 'user', text: userMessage },
            { role: 'assistant', text: "" }, // placeholder for streaming AI
        ])

        // 2️⃣ Call the route
        const response = await fetch("/api/ollama", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userMessage }),
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

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {openChat && (
                <div className="fixed inset-0 z-40" role="dialog" aria-modal>
                    <div className="absolute inset-0 bg-black/40" onClick={toggleChat} />
                    <div className="absolute right-6 bottom-20 top-6 w-96 max-w-full rounded-2xl bg-white/5 backdrop-blur-[2px] flex flex-col">
                        <div className="flex items-center justify-between border-b px-4 py-3 ">
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

                                <div className='flex justify-center items-center gap-2'>
                                    <textarea
                                        name="asd"
                                        id="adasd"
                                        className='p-2 resize-none w-full rounded-lg'
                                        placeholder='Ask me anything about João'
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                    />
                                    <button
                                        className='border-2 p-2 rounded-full'
                                        onClick={handleSend}
                                    >
                                        <SendHorizonalIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                role="button"
                tabIndex={0}
                aria-label="Open AI chat"
                aria-expanded={openChat}
                onClick={toggleChat}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleChat()}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <MessageCircleIcon />
            </div>
        </div>
    )
}
