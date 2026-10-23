import { randomUUID } from "node:crypto";
import { getModel } from "../config/llmModel.js";
import { generatePdf } from "../utils/generatePdf.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import redis from "../../../shared/redis/redis.js";

export const pdfAgent = async (state) => {
  try {
    const llm = await getModel("pdf");
    const prompt = `
You are Akshar AI's professional document writer.

Create high-quality, well-organized content for the user's topic.
Return ONLY valid JSON. Do not include Markdown fences or explanations.
Use exactly this structure:
{
  "title": "Document title",
  "subtitle": "Document subtitle",
  "sections": [
    {
      "heading": "Section heading",
      "points": ["First concise point", "Second concise point", "Third concise point"]
    }
  ]
}

Requirements:
- Generate 4-8 meaningful sections.
- Each section must contain 3-6 informative bullet points.
- Ensure factual accuracy, clarity, and logical flow.
- Escape special characters correctly in JSON.
- Do not invent citations or sources.

User's topic:
${state.prompt}
`;

    const res = await llm.invoke(prompt);
    const content = typeof res.content === "string"
      ? res.content
      : Array.isArray(res.content)
        ? res.content.map((part) => typeof part === "string" ? part : part.text ?? "").join("")
        : "";

    const json = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const data = JSON.parse(json);

    if (typeof data.title !== "string" || !Array.isArray(data.sections)) {
      throw new Error("Invalid document structure returned by the model");
    }
    if (!state.userId) throw new Error("Authenticated user ID is missing");

    const pdfBuffer = await generatePdf(data);
    const filename = `pdf-${randomUUID()}.pdf`;
    await uploadToS3(filename, pdfBuffer, "application/pdf");

    const baseUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
    if (!baseUrl) throw new Error("BACKEND_URL is not configured");

    await redis.set(
      `asset:${filename}`,
      JSON.stringify({ userId: String(state.userId) }),
      "EX",
      604800
    );

    const aksharAiDownloadUrl = `${baseUrl}/api/agent/images/${encodeURIComponent(filename)}`;

    return {
      ...state,
      aiResponse: `
# 📄 PDF Generated Successfully

**${data.title}**

[**Download PDF**](${aksharAiDownloadUrl})

_Available for 7 days._
`,
    };
  } catch (error) {
    console.error("PDF agent error:", error);
    return { ...state, aiResponse: "Failed to generate PDF. Please try again." };
  }
};
