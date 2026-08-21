import "dotenv/config";

export const MODEL_CONFIG = {
    google: {
        model: "gemini-3-flash-preview",
        temperature: 0,
        maxRetries: 2,
        streaming: true,
    },
    ollama: {
        baseUrl: "http://localhost:11434",
        model: "qwen3:30b-a3b",
        temperature: 0,
        numCtx: 16448,
    },
} as const;

export function getGoogleModelConfig() {
    return {
        ...MODEL_CONFIG.google,
        apiKey: process.env.GOOGLE_API_KEY!,
    };
}

export function getOllamaModelConfig() {
    return {
        baseUrl: process.env.OLLAMA_URL ?? MODEL_CONFIG.ollama.baseUrl,
        model: process.env.OLLAMA_CHAT_MODEL ?? MODEL_CONFIG.ollama.model,
        temperature: MODEL_CONFIG.ollama.temperature,
        numCtx: MODEL_CONFIG.ollama.numCtx,
    };
}
