import { visionAgent } from "../agents/vision.agent.js";

export const generateVisionImage = async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const result = await visionAgent({ prompt });

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", 'inline; filename="akshar-generated-image.' + result.extension + '"');
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(result.imageBytes);
  } catch (error) {
    console.error("Vision generation failed:", error);
    const message = error instanceof Error ? error.message : "Image generation failed.";
    const status = /not configured/i.test(message) ? 503 : 502;
    return res.status(status).json({
      message: status === 503 ? message : "Image generation is temporarily unavailable. Please try again.",
    });
  }
};
