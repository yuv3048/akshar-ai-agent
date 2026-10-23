
import { getModel } from "../config/llmModel.js";
import { generatePdf } from "../utils/generatePdf.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";

export const pdfAgent = async (state) => {
  try {
    const llm = await getModel("pdf");

    const prompt = `
You are Akshar AI's professional document writer.

Create high-quality, well-organized content for the user's topic.

Return ONLY valid JSON. Do not include Markdown fences,
explanations, or any text outside the JSON object.

Use exactly this structure:
{
  "title": "Document title",
  "subtitle": "Document subtitle",
  "sections": [
    {
      "heading": "Section heading",
      "points": [
        "First concise point",
        "Second concise point",
        "Third concise point"
      ]
    }
  ]
}

Requirements:
- Generate 4-8 meaningful sections.
- Each section must contain 3-6 informative bullet points.
- Ensure factual accuracy, clarity, and logical flow.
- Avoid repetitive or irrelevant content.
- Escape special characters correctly in JSON.
- Do not invent citations or sources.

User's topic:
${state.prompt}
`;

    const res = await llm.invoke(prompt);

    const content =
      typeof res.content === "string"
        ? res.content
        : res.content
            .map((part) =>
              typeof part === "string" ? part : part.text ?? ""
            )
            .join("");

    const json = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const data = JSON.parse(json);

    if (
      typeof data.title !== "string" ||
      !Array.isArray(data.sections)
    ) {
      throw new Error("Invalid document structure returned by the model");
    }

    const pdfBuffer = await generatePdf(data);

    const filename = `pdf-${Date.now()}.pdf`;

    await uploadToS3(filename, pdfBuffer, "application/pdf");

    // 600 seconds = 10 minutes
    const downloadUrl = await getFromS3(filename, 600);

    console.log("PDF generated:", filename);
    console.log("Download URL:", downloadUrl);

    return {
      ...state,
      aiResponse: `# PDF Generated

    **${data.title}**
        
    [Download PDF](${downloadUrl})
        
    _Link expires in 10 minutes._`,
    };
  } catch (error) {
    console.error("PDF agent error:", error);

    return {
      ...state,
      aiResponse: "Failed to generate PDF. Please try again.",
    };
  }
};
