import express from "express"
import { createConversation, getConversation, getConversationById, getMessages, saveMessage, updateConversation } from "../controllers/chat.controller.js"

const router = express.Router()

router.get("/create-conversation", createConversation)
router.get("/get-conversation", getConversation)
router.get("/get-conversation/:conversationId", getConversationById)
router.post("/update-conversation", updateConversation)
router.post("/save-message", saveMessage)
router.get("/get-messages/:conversationId", getMessages)

export default router