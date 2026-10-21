import express from "express"
import { createConversation, getConversation, getMessages, saveMessage, updateConversation } from "../controllers/chat.controller.js"

const router = express.Router()

router.get("/create-conversation", createConversation)
router.get("/get-conversation", getConversation)
router.post("/update-conversation", updateConversation)
router.post("/save-message", saveMessage)
router.get("/get-messages/:conversationId", getMessages)

export default router