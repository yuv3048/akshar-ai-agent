import { getModel } from '../config/llmModel.js'
import axios from 'axios';
import { uploadToS3 } from '../utils/uploadToS3.js';
import { getFromS3 } from '../utils/getFromS3.js';

export const visionAgent = async(state)=>{

    try {

    const llm = await getModel("image");
    const res = await llm.invoke(`

You are an elite AI image prompt engineer.

Convert the user request into a highly detailed image generation prompt.

Requirements:

- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photorealistic
- Depth of field
- Professional photography
- Stunning visuals

Return only the image prompt.

User Request:
${state.prompt}
        `)

const prompt = res.content.trim()

const imageRes = await axios.post(
  `${process.env.VISION_WORKER_URL}/generate`,
  { prompt },
  {
    responseType: "arraybuffer",
    timeout: 180000,
    headers: {
      Authorization: `Bearer ${process.env.VISION_API_SECRET}`,
    },
  }
);

const buffer = Buffer.from(imageRes.data);

const filename = `image-${Date.now()}.jpg`

console.log("Uploading:", filename);

await uploadToS3(filename, buffer, "image/jpeg");

console.log("Upload successful");

const downloadUrl = await getFromS3(filename, 10 * 60);

console.log("Download URL generated");

return {
    ...state,
    aiResponse:`

#  🖼️ Image Generated Successfully

![Generated Image](${downloadUrl})

🔗 [Download Image](${process.env.BACKEND_URL}/api/images/${filename}/download)

⏱️ Link expires in 10 minutes.

`
}
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
        aiResponse: "❌ Image generation failed. Check backend logs."
    };
}
}