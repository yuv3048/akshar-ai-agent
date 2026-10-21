import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

export const agent = async (req, res) => {
  try {

    const { prompt, conversationId, agent } = req.body;

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "User ID missing",
      });
    }

    await axios.post(
      `${process.env.CHAT_SERVICE_URL}/save-message`,
      {
        conversationId,
        role: "user",
        content: prompt,
        agent
      }
    );


    const result = await graph.invoke({
      prompt,
      conversationId,
      userId,
    });

    const response = result?.aiResponse;

    await axios.post(
      `${process.env.CHAT_SERVICE_URL}/save-message`,
      {
        conversationId,
        role: "assistant",
        content: response,
        images: result?.images,
        artifacts:result?.artifacts
      }
    );

    await addMessage(conversationId, "user", prompt);
    await addMessage(conversationId, "assistant", response);

    return res.status(200).json({
      answer:result?.aiResponse,
      images:result?.images,
      artifacts: result?.artifacts
    });

   } catch (error) {
    console.error("Agent error:", error.stack || error);

    return res.status(500).json({
        message: "Agent request failed",
    });
    }
};
