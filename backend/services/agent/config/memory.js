import redis from "../../../shared/redis/redis.js";
import { getMessages } from "../utils/getMessages.js";
import { getModel } from "./llmModel.js";
import {
  SystemMessage,
  HumanMessage,
} from "@langchain/core/messages";

export const getMemory = async (conversationId) => {
  const key = `messages-${conversationId}`;

  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const messages = await getMessages(conversationId);

  await redis.set(key, JSON.stringify(messages), "EX", 86400);

  return messages;
};

export const addMessage = async (
  conversationId,
  userId,
  role,
  content
) => {
  const key = `messages-${conversationId}`;
  const rawMessages = await redis.get(key);
  const messages = rawMessages ? JSON.parse(rawMessages) : [];

  messages.push({ role, content });

  if (messages.length > 5) {
    const oldMessage = messages.shift();

    await updateGlobalMemory(userId, oldMessage);
  }

  await redis.set(key, JSON.stringify(messages), "EX", 86400);
};

const updateGlobalMemory = async (userId, oldMessage) => {
  const key = `global-memory-${userId}`;

  const previousSummary = (await redis.get(key)) || "";

  const llm = await getModel("chat");

  const response = await llm.invoke([
    new SystemMessage(`
You are Akshar AI's global memory manager. Update persistent memory
using the existing memory and a new conversation message.

Maintain a valid JSON object with exactly these categories:

{
  "goals": [],
  "important_facts": [],
  "user_preferences": [],
  "explicit_memories": [],
  "decisions": [],
  "ongoing_tasks": [],
  "unresolved_questions": [],
  "technical_context": []
}

Rules:
1. Preserve useful existing information.
2. Prioritize explicit memory requests such as "remember",
   "always", "never", and "from now on".
3. Retain stable preferences, goals, facts, decisions, project
   details, and unfinished tasks.
4. Merge information without unnecessary duplication.
5. Update outdated facts when the user corrects them.
6. Do not treat hypothetical or quoted text as confirmed facts.
7. Never invent facts.
8. Prioritize long-term information over temporary details.
9. Keep memory concise without arbitrarily truncating explicit memories.
10. Return ONLY the complete updated JSON object.
`),
    new HumanMessage(`
EXISTING SUMMARY:
${previousSummary || "No existing memory yet."}

NEW MESSAGE:
Role: ${oldMessage.role}
Content: ${oldMessage.content}
`),
  ]);

  const summary =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  if (!summary?.trim()) {
    throw new Error("Global memory summarization returned an empty result");
  }


  JSON.parse(summary);

  await redis.set(key, summary);
};
