import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage, getMemory } from "../config/memory.js";
import { getModel } from "../config/llmModel.js";
import redis from "../../../shared/redis/redis.js";

const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_WINDOW_SECONDS = 60;

const generateConversationTitle = async (prompt) => {
  // Build titles directly from the user's first prompt. The title LLM was
  // occasionally returning words with spaces inserted inside them.
  const cleaned = String(prompt ?? "")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s"'#>*-]+|[\s"'#]+$/g, "")
    .trim();

  if (!cleaned) return "New Chat";

  const words = cleaned.split(" ").filter(Boolean);
  let title = words.slice(0, 6).join(" ");
  if (title.length > 48) title = title.slice(0, 48).replace(/\s+\S*$/, "").trim();
  if (!title) title = cleaned.slice(0, 48).trim();

  return title ? title.charAt(0).toLocaleUpperCase() + title.slice(1) : "New Chat";
};

export const agent = async (req, res) => {
  try {
    const { conversationId, agent: requestedAgent, generateTitle = false } = req.body ?? {};
    const userId = req.headers["x-user-id"];
    const file = req.file ?? null;
    const rawPrompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const prompt = rawPrompt || (file
      ? file.mimetype === "application/pdf"
        ? "Summarize this PDF and identify its key points."
        : "Describe this image and analyze its important details."
      : "");

    if (!userId) return res.status(401).json({ message: "User ID missing" });
    if (!prompt || prompt.length > 20000) {
      return res.status(400).json({ message: "Enter a message or attach a PDF/image to analyze." });
    }
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const rateKey = `chat-rate:${userId}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) await redis.expire(rateKey, CHAT_RATE_WINDOW_SECONDS);
    if (rateCount > CHAT_RATE_LIMIT) {
      return res.status(429).json({ message: "Too many requests. Please wait a minute and try again." });
    }

    await getMemory(conversationId, userId);

    await axios.post(
      `${process.env.CHAT_SERVICE_URL}/save-message`,
      { conversationId, role: "user", content: prompt, agent: file ? (file.mimetype === "application/pdf" ? "pdfRag" : "imageAnalyzer") : requestedAgent },
      { headers: { "x-user-id": userId } }
    );

    await addMessage(conversationId, userId, "user", prompt);

    const result = await graph.invoke({
      prompt,
      conversationId,
      userId,
      file,
      agent: requestedAgent || "auto",
    });

    const response = result?.aiResponse;
    if (typeof response !== "string" || !response.trim()) {
      throw new Error("Agent returned an empty response");
    }

    await axios.post(
      `${process.env.CHAT_SERVICE_URL}/save-message`,
      {
        conversationId,
        role: "assistant",
        content: response,
        images: result?.images,
        artifacts: result?.artifacts,
      },
      { headers: { "x-user-id": userId } }
    );

    await addMessage(conversationId, userId, "assistant", response);

    let title = null;
    // FormData serializes booleans as strings, so accept both representations.
    if (generateTitle === true || generateTitle === "true") {
      try {
        const titleResponse = await axios.post(
          `${process.env.CHAT_SERVICE_URL}/update-conversation`,
          { id: conversationId, title: await generateConversationTitle(prompt), onlyIfNew: true },
          { headers: { "x-user-id": userId } }
        );
        title = titleResponse.data?.title || null;
      } catch (error) {
        console.error("Conversation title generation failed:", error.response?.data || error.message);
      }
    }

    return res.status(200).json({
      answer: response,
      images: result?.images,
      artifacts: result?.artifacts,
      title,
      conversationId,
    });
  } catch (error) {
    console.error("Agent error:", error.response?.data || error.stack || error);
    const status = error.response?.status;
    return res.status(status === 404 ? 404 : status === 400 ? 400 : 500).json({
      message: status === 404 ? "Conversation not found" : "Agent request failed",
    });
  }
};
