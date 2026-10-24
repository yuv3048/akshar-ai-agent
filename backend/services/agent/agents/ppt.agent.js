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

const parseJson = (content) => {
  const cleaned = content
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error("The model did not return a JSON presentation");
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
};

const validatePresentation = (data) => {
  if (
    !data ||
    typeof data.title !== "string" ||
    !data.title.trim() ||
    !Array.isArray(data.slides) ||
    data.slides.length < 4 ||
    data.slides.length > 10
  ) {
    throw new Error("Invalid presentation structure returned by the model");
  }

  data.title = data.title.trim().slice(0, 100);
  data.subtitle = typeof data.subtitle === "string" ? data.subtitle.trim().slice(0, 180) : "";

  data.slides = data.slides.map((slide, index) => {
    if (
      !slide ||
      typeof slide.title !== "string" ||
      !slide.title.trim() ||
      !Array.isArray(slide.points) ||
      slide.points.length < 2 ||
      slide.points.length > 5 ||
      slide.points.some((point) => typeof point !== "string" || !point.trim())
    ) {
      throw new Error(`Invalid content on slide ${index + 1}`);
    }

    const allowedLayouts = ["bullets", "split", "steps", "quote", "stat"];
    return {
      title: slide.title.trim().slice(0, 100),
      eyebrow: typeof slide.eyebrow === "string" ? slide.eyebrow.trim().slice(0, 40) : "",
      layout: allowedLayouts.includes(slide.layout) ? slide.layout : "bullets",
      points: slide.points.map((point) => point.trim().slice(0, 240)),
      takeaway: typeof slide.takeaway === "string" ? slide.takeaway.trim().slice(0, 180) : "",
    };
  });

  return data;
};

export const pptAgent = async (state) => {
  try {
    const topic = String(state.prompt ?? "").trim();
    if (!topic) throw new Error("Presentation topic is empty");

    const llm = await getModel("ppt");
    const prompt = `
You are Akshar AI's senior presentation strategist, subject-matter researcher, and visual storyteller.
Create a presentation that feels intentionally designed by a skilled human—not a document pasted onto slides.

USER REQUEST:
<topic>
${topic}
</topic>

CONTENT GOALS
- Infer the audience and purpose from the request. If unspecified, target an intelligent general audience.
- Be specific, useful, accurate, and logically progressive. Explain the subject, why it matters, the important ideas, practical application, and a meaningful conclusion.
- Match the depth and number of slides to the topic. Create 5–8 content slides (not counting the cover and closing slide).
- Give each slide one clear message. Use concrete examples, comparisons, steps, or practical implications where they improve understanding.
- Avoid generic filler, repeated points, long paragraphs, and empty headings.
- Prefer concise, presentation-ready language. Most points should be 8–18 words and never exceed 24 words.
- Use numbers or statistics only when reliable; never fabricate facts, sources, quotes, or data. If the topic depends on current facts that you cannot verify, qualify claims instead of pretending certainty.
- Do not add a references slide unless the user requests sources or the topic genuinely requires them. Never invent citations.

VISUAL STORYTELLING
- Return different suitable layout values across the deck where it helps the narrative: "bullets", "split", "steps", "quote", or "stat". Use "bullets" as the safe default.
- "steps" is for a sequential process; "quote" is for a memorable takeaway or short original statement, not a fabricated attribution; "stat" is for real, well-grounded numeric facts only. Do not force these layouts if they do not fit the topic.
- Include a short "eyebrow" label for context (for example, "THE PROBLEM", "HOW IT WORKS", "PRACTICAL EXAMPLE").
- Include a "takeaway" only when it adds a memorable conclusion; otherwise use an empty string.
- Keep slide titles short (ideally 3–8 words). Use 2–4 points per slide, except a "steps" slide may use up to 5. Keep the deck uncluttered.
- Make the cover title engaging and concise. The subtitle should tell the audience what the presentation delivers.
- The final content slide should synthesize the key insight or provide practical next steps. A separate closing slide is added by the renderer.

OUTPUT CONTRACT
Return ONLY valid JSON. No Markdown fences, commentary, or extra keys. Escape all JSON strings correctly. Use exactly this structure:
{
  "title": "Presentation title",
  "subtitle": "What the audience will learn",
  "slides": [
    {
      "title": "Short slide title",
      "eyebrow": "SECTION LABEL",
      "layout": "bullets",
      "points": ["Point one", "Point two", "Point three"],
      "takeaway": ""
    }
  ]
}

Return 5–8 slides. Every slide must contain a title and 2–4 concise points (up to 5 for steps). Use empty string for an unused takeaway.
`;

    const response = await llm.invoke(prompt);
    const data = validatePresentation(parseJson(extractText(response?.content)));

    if (!state.userId) throw new Error("Authenticated user ID is missing");

    const ppt = await generatePpt(data);
    const buffer = await ppt.write({ outputType: "nodebuffer" });
    const filename = `ppt-${randomUUID()}.pptx`;
    const contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    await uploadToS3(filename, buffer, contentType);

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
