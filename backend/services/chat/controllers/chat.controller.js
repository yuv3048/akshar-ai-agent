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

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 4, 1), 20);
    const { beforeUpdatedAt, beforeId } = req.query;
    const filter = { userId };

    if (beforeUpdatedAt && beforeId) {
      const cursorDate = new Date(beforeUpdatedAt);
      if (Number.isNaN(cursorDate.getTime())) {
        return res.status(400).json({ message: "Invalid conversation cursor" });
      }
      filter.$or = [
        { updatedAt: { $lt: cursorDate } },
        { updatedAt: cursorDate, _id: { $lt: beforeId } },
      ];
    }

    const rows = await Conversation.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];

    return res.status(200).json({
      items,
      hasMore,
      nextCursor: hasMore && last
        ? { updatedAt: last.updatedAt, id: last._id }
        : null,
    });
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

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const { beforeCreatedAt, beforeId } = req.query;
    const filter = { conversationId };

    if (beforeCreatedAt && beforeId) {
      const cursorDate = new Date(beforeCreatedAt);
      if (Number.isNaN(cursorDate.getTime())) {
        return res.status(400).json({ message: "Invalid message cursor" });
      }
      filter.$or = [
        { createdAt: { $lt: cursorDate } },
        { createdAt: cursorDate, _id: { $lt: beforeId } },
      ];
    }

    // Fetch newest-first so the cursor always points to the oldest loaded item.
    const rows = await Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const oldest = page[page.length - 1];

    return res.status(200).json({
      items: page.reverse(),
      hasMore,
      nextCursor: hasMore && oldest
        ? { createdAt: oldest.createdAt, id: oldest._id }
        : null,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ message: "Failed to get messages" });
  }
};
