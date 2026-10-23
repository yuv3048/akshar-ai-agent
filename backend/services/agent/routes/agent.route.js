import express from "express"
import { agent } from "../controllers/agent.controller.js"
import { downloadImage } from "../controllers/image.controller.js";

const router = express.Router()

router.post("/chat",agent)
router.get("/images/:filename", downloadImage)

export default router