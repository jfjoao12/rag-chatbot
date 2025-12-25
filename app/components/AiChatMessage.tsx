type AiChatMessageProps = {
    text: string
}

export default function AiChatMessage(aiChatMessageProps: AiChatMessageProps) {
    return (
        <div className="self-start rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800 transition-opacity opacity-100">
            {aiChatMessageProps.text}
        </div>
    )
}
