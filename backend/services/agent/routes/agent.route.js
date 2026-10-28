import express from "express";
import multer from "../config/multer.js"
import { agent } from "../controllers/agent.controller.js";
import { downloadAsset } from "../controllers/download.controller.js";
import { previewAsset } from "../controllers/preview.controller.js";

const router = express.Router();

router.post("/chat", multer.single("file"), agent);

router.get("/images/:filename", downloadAsset);
router.get("/preview/:filename", previewAsset);

export default router;
