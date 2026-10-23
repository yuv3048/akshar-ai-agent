import { getModel } from '../config/llmModel.js'
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { uploadToS3 } from '../utils/uploadToS3.js';
import { getFromS3 } from '../utils/getFromS3.js';
import redis from '../../../shared/redis/redis.js';

export const visionAgent = async(state)=>{

    try {

    const llm = await getModel("image");
    const res = await llm.invoke(`
You are Akshar AI's expert image-prompt writer. Preserve the user's requested subject, style, and details. Return one cohesive image-generation prompt only. Add relevant composition, lighting, and material detail without changing the intent. Avoid unrelated objects, generic substitutions, contradictory details, and explanations.

User request:
${state.prompt}
        `)

const prompt = typeof res.content === "string" ? res.content.trim() : "";
if (!prompt) throw new Error("Image prompt generation returned empty content");

const imageRes = await axios.post(
  `${process.env.VISION_WORKER_URL}/generate`,
  { prompt },
  {
    responseType: "arraybuffer",
    timeout: 180000,
    headers: { Authorization: `Bearer ${process.env.VISION_API_SECRET}` },
  }
);

const buffer = Buffer.from(imageRes.data);
const filename = `image-${randomUUID()}.jpg`;

await uploadToS3(filename, buffer, "image/jpeg");

const baseUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
if (!baseUrl) throw new Error("BACKEND_URL is not configured");
if (!state.userId) throw new Error("Authenticated user ID is missing");

const previewS3Url = await getFromS3(filename, 600, "inline");
const downloadS3Url = await getFromS3(filename, 600, "attachment");

await redis.set(
  `asset:${filename}`,
  JSON.stringify({ userId: String(state.userId), previewUrl: previewS3Url, downloadUrl: downloadS3Url }),
  "EX",
  540
);

const previewUrl = `${baseUrl}/api/agent/preview/${encodeURIComponent(filename)}`;
const downloadUrl = `${baseUrl}/api/agent/images/${encodeURIComponent(filename)}`;

return {
  ...state,
  aiResponse: `
# 🖼️ Image Generated Successfully

![Generated Image](${previewUrl})

[Download Image](${downloadUrl})

_Expires in 9 minutes._
`,
};

} catch (error) {
    console.error("Vision Agent Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
            ? Buffer.isBuffer(error.response.data)
                ? error.response.data.toString("utf8").slice(0, 1000)
                : error.response.data
            : undefined,
        url: error.config?.url
    });

    return {
        ...state,
        aiResponse: "❌ Image generation failed 🥺... "
    };
}
}
