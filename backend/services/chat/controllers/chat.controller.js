import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const getUserId = (req) => req.get("x-user-id");

export const createConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversation = await Conversation.create({ userId });
    return res.status(201).json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    return res.status(500).json({ message: "Failed to create conversation" });
  }
};

export const getConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 });
    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({ message: "Failed to get conversations" });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id, title, onlyIfNew = false } = req.body;
    if (!id || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Conversation id and title are required" });
    }

    const filter = { _id: id, userId };
    if (onlyIfNew) filter.title = "New Chat";

    const conversation = await Conversation.findOneAndUpdate(
      filter,
      { $set: { title: title.trim().slice(0, 80) } },
      { new: true, runValidators: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error("Update conversation error:", error);
    return res.status(500).json({ message: "Failed to update conversation" });
  }
};

export const saveMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { conversationId, role, content, images, artifacts } = req.body;
    if (!conversationId || !["user", "assistant"].includes(role)) {
      return res.status(400).json({ message: "Conversation id and valid role are required" });
    }

    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const message = await Message.create({
      conversationId,
      content,
      role,
      images,
      artifacts,
    });

    await Conversation.updateOne({ _id: conversationId, userId }, { $set: { updatedAt: new Date() } });
    return res.status(201).json(message);
  } catch (error) {
    console.error("Save message error:", error);
    return res.status(500).json({ message: "Failed to save message" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({ _id: conversationId, userId }).select("_id");
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ message: "Failed to get messages" });
  }
};
