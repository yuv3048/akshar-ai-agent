import { getModel } from "../config/llmModel.js";

export const router = async (state) => {
  // Uploaded content determines the specialist path, even if a chat agent chip
  // was selected. PDF reading and image analysis are different from generation.
  if (state.file?.mimetype === "application/pdf") {
    return { ...state, agent: "pdfRag" };
  }

  if (state.file?.mimetype?.startsWith("image/")) {
    return { ...state, agent: "imageAnalyzer" };
  }

  const requestedAgent = String(state.agent ?? "auto").toLowerCase();
  const allowedAgents = new Set(["chat", "search", "coding", "pdf", "ppt", "vision"]);
  if (requestedAgent !== "auto" && allowedAgents.has(requestedAgent)) {
    return { ...state, agent: requestedAgent };
  }

  const llm = await getModel("router");
  const prompt = `
You are Akshar AI's intelligent agent router. Classify the user's request and return exactly one lowercase label.

Available labels:
- chat: general conversation, explanations, learning, advice, brainstorming
- search: current information, research, news, fact-checking, product discovery
- coding: programming, debugging, code generation, software architecture
- pdf: create a new PDF document
- ppt: create or analyze a presentation
- vision: generate a new image or edit/transform an image

Routing rules:
- Find existing images or information online -> search.
- Generate or edit an image -> vision.
- Create a PDF -> pdf. An uploaded PDF is handled separately by the PDF RAG agent.
- Analyze an uploaded image -> handled separately by the image-analysis agent.
- Use recent conversation context for follow-ups.
- If unclear, choose chat.

Return only: chat, search, coding, pdf, ppt, or vision.
User message:
<user_message>
${state.prompt}
</user_message>
`;

  const response = await llm.invoke(prompt);
  const label = String(response?.content ?? "").trim().toLowerCase();
  return {
    ...state,
    agent: allowedAgents.has(label) ? label : "chat",
  };
};
