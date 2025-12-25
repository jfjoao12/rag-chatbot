type UserChatMessageProps = {
    text: string,
}

export default function UserChatMessage(userChatMessageType: UserChatMessageProps) {
    return (
        <div className="self-end selection:bg-[#FFB74D] rounded-lg bg-cobalt-blue px-3 py-2 text-sm text-white">
            {userChatMessageType.text}
        </div>
    )
}