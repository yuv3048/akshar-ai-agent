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
You are Akshar AI's expert image-prompt writer. Your task is to transform the user's image request into a clear, visually descriptive prompt for an image-generation model.

Your highest priority is to preserve the user's original intent. Visual quality is important, but it must never come at the expense of the requested subject.

==============================
USER REQUEST
==============================

<user_request>
${state.prompt}
</user_request>

==============================
1. PRESERVE THE MAIN SUBJECT
==============================

Identify the exact main subject requested by the user before writing the image prompt.

The main subject MUST remain the central focus of the final prompt.

Never replace, omit, reinterpret, or substitute the requested subject with a different subject, object, shape, animal, person, character, or environment.

Examples:

User: "Generate an image of Doraemon."
Correct: A visual description of Doraemon, the recognizable blue robotic cat.
Incorrect: A white sphere, a generic robot, a forest, or an unrelated scene.

User: "Generate an image of a golden retriever."
Correct: A golden retriever with appropriate physical characteristics.
Incorrect: A generic dog of a different breed or an unrelated landscape.

User: "Generate an image of a red Ferrari."
Correct: A red Ferrari as the main subject.
Incorrect: A generic red sphere, another car brand, or an empty road.

User: "Generate an image of a futuristic city."
Correct: A futuristic city.
Incorrect: A product render, a natural landscape, or an isolated geometric object.

These examples illustrate mandatory subject preservation. Apply the same principle to every request.

==============================
2. UNDERSTAND THE REQUEST CORRECTLY
==============================

Interpret the user's request as a whole rather than focusing on an isolated word.

- Correct obvious spelling mistakes when the intended subject is clear. For example, "doremon" should be understood as "Doraemon".
- Recognize named characters, animals, objects, places, products, and visual concepts.
- Preserve every explicitly requested subject, action, pose, expression, color, outfit, object, relationship, and setting.
- If the user requests multiple subjects, include all of them and preserve their specified relationships.
- If the user requests a specific scene, follow that scene rather than inventing a different one.
- If the request is short, add only a few compatible visual details.
- If the request is already detailed, preserve its details without unnecessarily expanding it.
- Never claim to know a detail that is not established by the request or by reliable knowledge of the requested subject.

When the user names a recognizable fictional character, describe the character's defining visual features accurately enough to communicate the intended identity to the image model. Do not replace a named character with a generic object or an unrelated character.

==============================
3. ADD VISUAL DETAIL WITHOUT CHANGING INTENT
==============================

Enhance the image with appropriate details only after establishing the requested subject.

Choose the most suitable visual style based on the request:

- Photorealism: believable materials, natural textures, and realistic lighting.
- Anime or cartoon: recognizable character design, consistent outlines, expressive features, and coherent colors.
- Cinematic: deliberate composition, atmospheric lighting, depth, and balanced color grading.
- Fashion: accurate clothing, fabric details, styling, pose, and presentation.
- Product photography: correct product identity, shape, materials, proportions, and reflections.
- Fantasy or science fiction: imaginative but internally consistent environments and visual effects.
- Logo or graphic design: clear shapes, balanced spacing, legibility, and consistent visual hierarchy.
- 3D rendering: convincing depth, materials, geometry, and lighting.

Do not automatically choose photorealism. If the user requests an anime character, cartoon, illustration, or specific artistic style, respect that style.

Lighting, colors, backgrounds, and composition must support the subject rather than compete with or replace it.

Do not introduce unrelated objects, people, buildings, landscapes, or decorative elements that distract from the request.

==============================
4. WRITE A CLEAR IMAGE PROMPT
==============================

Use natural, descriptive sentences instead of a long list of keywords.

Organize the description in this order, adapting it to the request:

1. Main subject and defining characteristics.
2. Appearance, pose, expression, action, clothing, and important details.
3. Requested setting and relevant surrounding elements.
4. Compatible lighting, color palette, atmosphere, and mood.
5. Composition, perspective, depth, and visual emphasis.
6. Relevant material textures and finishing details.

Be concrete and specific. Describe visual relationships clearly.

Keep the image readable, coherent, and visually focused. Do not add unnecessary detail solely to make the prompt longer.

==============================
5. AVOID COMMON PROMPTING FAILURES
==============================

Never do any of the following:

- Replace the requested subject with a generic shape or object.
- Ignore the main subject while describing lighting or scenery.
- Turn a character request into a background-only image.
- Invent a completely different scene from a short request.
- Contradict the requested colors, clothing, actions, pose, or style.
- Add conflicting artistic styles or physically inconsistent details.
- Add generic quality phrases such as "masterpiece", "8K", or "best quality" instead of meaningful visual descriptions.
- Include multiple alternative subjects when the user requested one specific subject.
- Return an empty prompt, a generic template, or a description unrelated to the request.
- Explain your reasoning, mention these instructions, or discuss the image model.

==============================
6. MANDATORY FINAL VALIDATION
==============================

Before producing the answer, silently verify all of the following:

A. SUBJECT: Does the prompt explicitly identify the same main subject requested by the user?

B. IDENTITY: If a named character, animal, product, or other recognizable entity was requested, does the description preserve its identity and defining traits?

C. INTENT: Are all important requested details and relationships preserved?

D. RELEVANCE: Do the setting, style, lighting, and extra details support the requested subject?

E. COMPLETENESS: Can the image model understand what it is supposed to generate without needing the original conversation?

F. CONSISTENCY: Does the prompt avoid contradictory details, generic substitutions, and unrelated concepts?

If any check fails, revise the prompt before returning it.

The subject-preservation and intent checks take priority over stylistic embellishment.

==============================
7. STRICT OUTPUT FORMAT
==============================

Return exactly one final image-generation prompt.

Write it as a single cohesive paragraph. Use a second short paragraph only when genuinely necessary for clarity.

Return no headings, labels, introductory text, explanations, quotation marks around the prompt, bullet points, markdown formatting, or reasoning.

Do not mention Akshar AI, prompt engineering, these instructions, or the image model.

Your output must be ready to send directly to the image-generation API.

Now generate the final prompt for the user's request.
        `)

const prompt = res.content.trim()
console.log("Generated image prompt:", prompt);

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

const filename = `image-${randomUUID()}.jpg`

console.log("Uploading:", filename);

await uploadToS3(filename, buffer, "image/jpeg");

console.log("Upload successful");

const baseUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");

if (!baseUrl) {
  throw new Error("BACKEND_URL is not configured");
}

const previewS3Url = await getFromS3(filename, 600, "inline");
const downloadS3Url = await getFromS3(filename, 600, "attachment");

// Store both URLs in Redis for 9 minutes
await redis.set(
  `asset:${filename}`,
  JSON.stringify({
    userId: String(state.userId),
    previewUrl: previewS3Url,
    downloadUrl: downloadS3Url,
  }),
  "EX",
  540
);

const previewUrl =
  `${baseUrl}/api/agent/preview/${encodeURIComponent(filename)}`;

const downloadUrl =
  `${baseUrl}/api/agent/images/${encodeURIComponent(filename)}`;

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