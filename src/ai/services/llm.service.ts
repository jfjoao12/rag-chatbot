import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";

import {
    getGoogleModelConfig,
    getOllamaModelConfig,
} from "../config/model.config";
import type { ModelProvider } from "../types/model-provider.types";

export function createChatModel(provider: ModelProvider): BaseChatModel {
    switch (provider) {
        case "google":
            return new ChatGoogleGenerativeAI(getGoogleModelConfig());
        case "ollama":
            return new ChatOllama(getOllamaModelConfig());
        default: {
            const unsupportedProvider: never = provider;
            throw new Error(`Unsupported provider: ${unsupportedProvider}`);
        }
    }
}
