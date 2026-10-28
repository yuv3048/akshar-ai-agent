import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

const uploadDir = path.resolve("./temp");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, uploadDir);
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase().slice(0, 12);
    callback(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter = (_req, file, callback) => {
  const isPdf = file.mimetype === "application/pdf";
  const isImage = file.mimetype.startsWith("image/");
  if (isPdf || isImage) return callback(null, true);
  return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

export default upload;
