import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

const groq = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.3,
  maxRetries: 2,
});

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  temperature: 0.2,
  maxRetries: 2,
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
      return groq;

    case "search":
      return groq;

    case "coding":
      return deepseek;

    default:
      return groq;
  }
};
