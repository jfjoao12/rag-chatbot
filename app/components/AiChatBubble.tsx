'use client'

import { useState } from 'react'
import { MessageCircleIcon, X, SendHorizonalIcon } from 'lucide-react'

export default function AiChatBubble() {
    const [openChat, setOpenChat] = useState(false)
    const toggleChat = () => setOpenChat(v => !v)

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {openChat && (
                <div className="fixed inset-0 z-40" role="dialog" aria-modal>
                    <div className="absolute inset-0 bg-black/40" onClick={toggleChat} />
                    <div className="absolute right-6 bottom-20 top-6 w-96 max-w-full rounded-2xl bg-black shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <span className="text-sm font-medium">AI Chat</span>
                            <button type="button" onClick={toggleChat} className="p-1">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex h-full flex-col justify-end gap-3">
                                {/* replace with your message list */}
                                <div className="self-start rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
                                    Hi, how can I help?                                     Hi, how can I help?
                                    Hi, how can I help?
                                    Hi, how can I help?

                                </div>
                                <div className="self-end rounded-l
                                 g bg-cobalt-blue px-3 py-2 text-sm text-white">
                                    User message here
                                </div>
                                <div className='flex justify-center items-center gap-2'>
                                    <textarea name="asd" id="adasd" className='resize-none w-full rounded-lg' placeholder='Ask me anything about João'>

                                    </textarea>
                                    <div className='border-2 p-2 rounded-full' >
                                        <SendHorizonalIcon />

                                    </div>
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
