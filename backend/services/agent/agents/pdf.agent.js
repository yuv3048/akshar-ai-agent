import { randomUUID } from "node:crypto";
import { getModel } from "../config/llmModel.js";
import { generatePdf } from "../utils/generatePdf.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import redis from "../../../shared/redis/redis.js";
import { deductCredits } from "../utils/deductCredits.js";

const extractText = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => typeof part === "string" ? part : part?.text ?? "")
      .join("");
  }
  return "";
};

const parseJson = (content) => {
  const cleaned = content
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("The model did not return a JSON document");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
};

const validateDocument = (data) => {
  if (
    !data ||
    typeof data.title !== "string" ||
    !data.title.trim() ||
    !Array.isArray(data.sections) ||
    data.sections.length < 4 ||
    data.sections.length > 10
  ) {
    throw new Error("Invalid document structure returned by the model");
  }

  return {
    title: data.title.trim().slice(0, 140),
    subtitle: typeof data.subtitle === "string" ? data.subtitle.trim().slice(0, 240) : "",
    sections: data.sections.map((section, index) => {
      if (
        !section ||
        typeof section.heading !== "string" ||
        !section.heading.trim() ||
        !Array.isArray(section.points) ||
        section.points.length < 2 ||
        section.points.length > 7 ||
        section.points.some((point) => typeof point !== "string" || !point.trim())
      ) {
        throw new Error(`Invalid content in section ${index + 1}`);
      }

      return {
        heading: section.heading.trim().slice(0, 140),
        points: section.points.map((point) => point.trim().slice(0, 1200)),
      };
    }),
  };
};

export const pdfAgent = async (state) => {
  try {
    const topic = String(state.prompt ?? "").trim();
    if (!topic) throw new Error("Document topic is empty");

    const llm = await getModel("pdf");
    const prompt = `
You are Akshar AI's senior document writer, editor, and subject-matter explainer.
Create a polished, genuinely useful PDF document—not a generic list of bullet points.

USER REQUEST:
<topic>
${topic}
</topic>

PURPOSE AND AUDIENCE
- Infer the likely audience and purpose from the request. If unspecified, write for an intelligent general reader.
- Respect the requested document type: guide, report, study notes, plan, explainer, proposal, checklist, or other format.
- Start with the fundamentals, build ideas in a logical order, and finish with a useful synthesis or next steps.
- Make the document self-contained, specific, readable, and practical. Explain important terms when needed.
- Include examples, comparisons, actionable advice, or step-by-step guidance when they genuinely help.

CONTENT QUALITY
- Create 5–8 meaningful sections (minimum 4, maximum 10).
- Each section must have 3–5 substantive points, with a maximum of 7 when the topic requires it.
- Each point should express one coherent idea. Use complete sentences where explanation is needed, not fragments or vague labels.
- Vary the section structure naturally; do not repeat the same idea in different words.
- Use concise headings that describe the actual content.
- Avoid filler introductions, generic conclusions, exaggerated claims, and repeated summaries.
- For technical topics, explain how things work and include practical implementation considerations where relevant.
- For learning material, include examples or common mistakes where useful.
- For plans or recommendations, make actions concrete and ordered.
- Use accurate facts. Never fabricate statistics, quotations, references, studies, or sources. If uncertain, qualify the claim clearly.
- Do not add citations unless reliable source details are available or the user explicitly asks for sources. Never invent a source.
- Do not include Markdown, HTML, or bullet symbols inside the JSON values. The PDF renderer will format the content.
- Keep individual points reasonably compact; avoid unnecessarily long paragraphs.

OUTPUT CONTRACT
Return ONLY valid JSON. No Markdown fences or commentary. Escape quotes and special characters correctly.
Use exactly this structure, with no extra keys:
{
  "title": "Clear, specific document title",
  "subtitle": "A useful one-sentence description of the document",
  "sections": [
    {
      "heading": "Descriptive section heading",
      "points": [
        "A clear explanation or useful action.",
        "A second distinct point with practical detail.",
        "A third point that advances the section."
      ]
    }
  ]
}
`;

    const response = await llm.invoke(prompt);
    const data = validateDocument(parseJson(extractText(response?.content)));

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

    const previewUrl = `${baseUrl}/api/agent/preview/${encodeURIComponent(filename)}`;
    const downloadUrl = `${baseUrl}/api/agent/images/${encodeURIComponent(filename)}`;

    await deductCredits(state.userId, "pdf");

    return {
      ...state,
      aiResponse: `
# 📄 PDF Generated Successfully

**${data.title}**

[**Preview PDF**](${previewUrl}) [**Download PDF**](${downloadUrl})

_Available for 7 days._
`,
    };
  } catch (error) {
    console.error("PDF agent error:", error);
    return { ...state, aiResponse: "Failed to generate PDF. Please try again." };
  }
};
