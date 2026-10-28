import express from "express";
import multer from "../config/multer.js";
import { agent } from "../controllers/agent.controller.js";
import { downloadAsset } from "../controllers/download.controller.js";
import { previewAsset } from "../controllers/preview.controller.js";

const router = express.Router();

const handleChatUpload = (req, res, next) => {
  multer.single("file")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "This file is larger than Akshar AI's 20 MB upload limit. Choose a smaller PDF or image.",
          code: error.code,
        });
      }
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          message: "Attach one PDF or image file only.",
          code: error.code,
        });
      }
    }

    console.error("Chat upload failed:", error);
    return res.status(400).json({
      message: "The file could not be uploaded. Please try again or choose another file.",
    });
  });
};

router.post("/chat", handleChatUpload, agent);
router.get("/images/:filename", downloadAsset);
router.get("/preview/:filename", previewAsset);

export default router;
