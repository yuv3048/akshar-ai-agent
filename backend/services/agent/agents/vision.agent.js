import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getModel } from "../config/llmModel.js";

const IMAGE_PROMPT_SYSTEM = `You are Akshar AI's senior visual-concept artist and image-prompt engineer. Convert the user's request into one production-ready text-to-image prompt.

Preserve the exact requested subject, number of subjects, action, pose, setting, style, colors, composition, aspect ratio, text and exclusions. Do not add unrelated people, props, logos, labels or scenery. Do not default to photorealism: choose the medium requested or the most natural medium for the request. Use concrete visual language for lighting, materials, camera, framing, depth and palette where useful. If exact text is requested, preserve spelling, capitalization and language. Do not invent text, watermarks or signatures. Avoid contradictory instructions and generic quality filler. Return one cohesive paragraph only, without headings, explanations or Markdown.`;

async function enhancePrompt(userPrompt) {
  try {
    const groq = await getModel("chat");
    const response = await groq.invoke([
      { role: "system", content: IMAGE_PROMPT_SYSTEM },
      { role: "user", content: userPrompt },
    ]);
    const text = typeof response.content === "string" ? response.content.trim() : "";
    if (text) return text;
    throw new Error("Groq returned an empty image prompt.");
  } catch (groqError) {
    if (!process.env.GOOGLE_API_KEY) throw groqError;
    const gemini = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.2,
      maxRetries: 1,
    });
    const response = await gemini.invoke([
      { role: "system", content: IMAGE_PROMPT_SYSTEM },
      { role: "user", content: userPrompt },
    ]);
    const text = typeof response.content === "string" ? response.content.trim() : "";
    if (!text) throw new Error("Gemini returned an empty image prompt.");
    return text;
  }
}

async function runCloudflareModel(model, prompt, fallback = false) {
  const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error("Cloudflare AI is not configured in the agent service.");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fallback
      ? { prompt, width: 1024, height: 1024 }
      : { prompt, steps: 4 }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Cloudflare image model failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const payload = await response.json();
  const encoded = payload?.result?.image;
  if (typeof encoded !== "string" || !encoded) {
    throw new Error("Cloudflare image model returned no image data.");
  }
  return Buffer.from(encoded, "base64");
}

function detectImageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { extension: "png", contentType: "image/png" };
  }
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return { extension: "webp", contentType: "image/webp" };
  }
  throw new Error("Cloudflare returned an unsupported image format.");
}

export const visionAgent = async ({ prompt }) => {
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 6000) {
    throw new Error("A valid image prompt is required (maximum 6,000 characters).");
  }

  const enhancedPrompt = await enhancePrompt(prompt.trim());
  let imageBytes;

  try {
    imageBytes = await runCloudflareModel("@cf/black-forest-labs/flux-1-schnell", enhancedPrompt);
  } catch (primaryError) {
    console.warn("FLUX.1 Schnell failed; trying FLUX.2 Klein 4B:", primaryError.message);
    imageBytes = await runCloudflareModel(
      "@cf/black-forest-labs/flux-2-klein-4b",
      enhancedPrompt,
      true,
    );
  }

  const imageType = detectImageType(imageBytes);
  return { imageBytes, ...imageType, enhancedPrompt };
};
