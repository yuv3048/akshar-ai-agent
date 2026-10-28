import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

const groq = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.3,
  maxRetries: 2,
});

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.2,
  maxRetries: 2,
});

// Retry Groq failures with Gemini without changing the agents that use getModel().
const groqWithGeminiFallback = groq.withFallbacks({
  fallbacks: [gemini],
});

const deepseek = new ChatOpenRouter({
  model: "deepseek/deepseek-chat",
  temperature: 0.1,
  maxTokens: 8192,
  maxRetries: 2,
});

export const getModel = async (agent) => {
  switch (agent) {
    case "chat":
      return groqWithGeminiFallback;

    case "search":
      return groqWithGeminiFallback;

    case "coding":
      return deepseek;

    case "imageAnalyzer":
      return gemini;

    default:
      return groqWithGeminiFallback;
  }
};
