import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmModel.js";
import fs from "node:fs/promises";
import { deductCredits } from "../utils/deductCredits.js";

export const imageAnalyzer = async (state) => {
  const file = state.file;
  try {
    if (!file?.path || !file?.mimetype?.startsWith("image/")) {
      throw new Error("A valid image upload is required");
    }

    const llm = await getModel("imageAnalyzer");
    const imageBuffer = await fs.readFile(file.path);
    const base64image = imageBuffer.toString("base64");
    const dataUrl = `data:${file.mimetype};base64,${base64image}`;

    const messages = [
      new SystemMessage(`You are Akshar AI Vision, an image-analysis assistant.
Answer the user's specific question first. Accurately describe visible text, code, numbers, charts, diagrams, screenshots, and objects when relevant.
Base claims on visible evidence. Never invent details. If something is blurry or uncertain, say so.
Use clear Markdown when useful, and be concise unless the user asks for detail.`),
      new HumanMessage({
        content: [
          { type: "text", text: state.prompt || "Analyze this image." },
          { type: "image_url", image_url: dataUrl },
        ],
      }),
    ];

    const response = await llm.invoke(messages);
    const answer = typeof response?.content === "string"
      ? response.content
      : Array.isArray(response?.content)
        ? response.content.map((part) => typeof part === "string" ? part : part?.text ?? "").join("")
        : "";

    if (!answer.trim()) throw new Error("Image model returned an empty answer");
    await deductCredits(state.userId, "vision");
    return { ...state, aiResponse: answer.trim() };
  } catch (error) {
    console.error("Image analysis error:", error);
    return { ...state, aiResponse: "I couldn't analyze this image right now. Please try another image or try again shortly." };
  } finally {
    if (file?.path) {
      try {
        await fs.unlink(file.path);
      } catch (error) {
        if (error.code !== "ENOENT") console.warn("Image upload cleanup failed:", error.message);
      }
    }
  }
};
