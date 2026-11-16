import express from "express"
import { agent } from "../controllers/agent.controller.js"
import { generateVisionImage } from "../controllers/vision.controller.js"
import { requireServiceAuth } from "../middleware/requireServiceAuth.js"

const router = express.Router()

router.post("/chat",agent)
router.post("/vision/generate", requireServiceAuth, generateVisionImage)

export default router