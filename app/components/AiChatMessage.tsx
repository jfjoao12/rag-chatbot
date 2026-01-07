import ReactMarkdown from 'react-markdown';

type AiChatMessageProps = {
    text: string
}

export default function AiChatMessage(aiChatMessageProps: AiChatMessageProps) {
    return (
        <div className="self-start rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800 transition-opacity opacity-100">
            <ReactMarkdown
                components={{
                    // Inline code vs code blocks
                    code: ({ children, className, ...props }) => {
                        // If there's a language class, it's a code block
                        const isCodeBlock = className?.startsWith('language-');

                        return isCodeBlock ? (
                            <code className="block bg-slate-200 p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                {children}
                            </code>
                        );
                    },
                    // Links
                    a: ({ children, ...props }) => (
                        <a className="text-blue-600 underline hover:text-blue-700" {...props}>
                            {children}
                        </a>
                    ),
                    // Paragraphs
                    p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    // Headings
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                    // Lists
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    // Strong/Bold
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}
            >
                {aiChatMessageProps.text}
            </ReactMarkdown>
        </div>
    )
}