import { randomUUID } from "node:crypto";
import { getModel } from "../config/llmModel.js";
import { generatePpt } from "../utils/generatePpt.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import redis from "../../../shared/redis/redis.js";

const extractText = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => typeof part === "string" ? part : part?.text ?? "")
      .join("");
  }
  return "";
};

export const pptAgent = async (state) => {
  try {
    const llm = await getModel("ppt");
    const prompt = `
You are Akshar AI's professional presentation designer.

Create a polished, informative PowerPoint presentation for the user's topic.
Return ONLY valid JSON, with no Markdown fences or explanations.
Use exactly this structure:
{
  "title": "Presentation title",
  "subtitle": "Short descriptive subtitle",
  "slides": [
    {
      "title": "Slide title",
      "points": ["Concise, informative point", "Another point"]
    }
  ]
}

Requirements:
- Generate exactly 6 content slides, in addition to the cover and closing slides.
- Each content slide must have 3-5 concise, useful bullet points.
- Give the slides a logical beginning, middle, and conclusion.
- Avoid repeating the same information across slides.
- Keep each point short enough to fit comfortably on a slide.
- Escape special characters correctly for valid JSON.
- Do not invent statistics, citations, or sources.

User's topic:
${state.prompt}
`;

    const res = await llm.invoke(prompt);
    const content = extractText(res?.content);
    const json = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const data = JSON.parse(json);

    if (
      typeof data.title !== "string" ||
      !Array.isArray(data.slides) ||
      data.slides.length === 0 ||
      data.slides.some((slide) =>
        typeof slide?.title !== "string" ||
        !Array.isArray(slide.points) ||
        slide.points.some((point) => typeof point !== "string")
      )
    ) {
      throw new Error("Invalid presentation structure returned by the model");
    }

    if (!state.userId) throw new Error("Authenticated user ID is missing");

    const ppt = await generatePpt(data);
    const buffer = await ppt.write({ outputType: "nodebuffer" });
    const filename = `ppt-${randomUUID()}.pptx`;
    const contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    await uploadToS3(filename, buffer, contentType);

    const baseUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
    if (!baseUrl) throw new Error("BACKEND_URL is not configured");

    // Match the PDF asset session: only its owner can use these links, for 7 days.
    await redis.set(
      `asset:${filename}`,
      JSON.stringify({ userId: String(state.userId) }),
      "EX",
      604800
    );

    const previewUrl = `${baseUrl}/api/agent/preview/${encodeURIComponent(filename)}`;
    const downloadUrl = `${baseUrl}/api/agent/images/${encodeURIComponent(filename)}`;

    return {
      ...state,
      aiResponse: `
# 📊 PowerPoint Generated Successfully

**${data.title}**

[**Preview PPT**](${previewUrl}) [**Download PPT**](${downloadUrl})

_Available for 7 days._
`,
    };
  } catch (error) {
    console.error("PPT agent error:", error);
    return { ...state, aiResponse: "Failed to generate PowerPoint. Please try again." };
  }
};
