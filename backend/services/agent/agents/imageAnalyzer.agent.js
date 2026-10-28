import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmModel.js";
import fs from "fs";
import { deductCredits } from "../utils/deductCredits.js";

export const imageAnalyzer = async (state) =>{
    try{
        const llm = await getModel("imageAnalyzer");

        const imageBuffer = fs.readFile(state.file.path);

        const base64image = imageBuffer.toString("base64");

        const messages = [
            new SystemMessage(`
You are Akshar AI Vision, an intelligent image-analysis assistant.
Your job is to understand the uploaded image and deliver accurate, relevant, and helpful answers to the user's questions.

Guidelines:
- Analyze the image carefully and answer the user's specific question first.
- Accurately extract visible text, code, numbers, and symbols when relevant.
- Clearly explain charts, tables, diagrams, screenshots, and error messages when needed.
- Base every visual claim on evidence from the image. Never invent details or make unsupported assumptions.
- If something is blurry, unreadable, or ambiguous, acknowledge the uncertainty instead of guessing.
- Use general knowledge to interpret the image when helpful, but never confuse assumptions with observations.
- Use clean Markdown formatting when it improves readability.
- Keep responses concise for simple questions and detailed for complex analysis.
- Core principle: See clearly. Think carefully. Answer accurately.

    `),
            new HumanMessage(
                {
                    content:[
                        {
                            type: "text",
                            text: state.prompt || "analyze the image"
                        },
                        {
                            type:"image_url",
                            "image_url": {
                                url: `data:${state.file.mimetype};base64,${base64image}`
                            }
                        }
                    ]
                }
            )
        ]

        const response = await llm.invoke(messages)
        await deductCredits(state.userId, "vision")

        return {
            ...state,
            aiResponse: response.content
        }

    }catch(error){
        console.log(error)
        return {
            ...state,
            aiResponse: "Failed to analyze file."
        }
    }
    finally{
        fs.unlink(state.file.path)
    }
}