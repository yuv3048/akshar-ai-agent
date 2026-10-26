import { GetObjectCommand } from "@aws-sdk/client-s3";
import redis from "../../../shared/redis/redis.js";
import { s3 } from "../config/s3.js";

export const downloadAsset = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { filename } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!filename || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(filename)) {
      return res.status(404).json({ message: "File not found" });
    }

    const cachedAsset = await redis.get(`asset:${filename}`);
    if (!cachedAsset) {
      return res.status(404).json({ message: "Download link expired or file not found" });
    }

    const asset = JSON.parse(cachedAsset);
    if (String(asset?.userId) !== String(userId)) {
      return res.status(404).json({ message: "File not found" });
    }

    const result = await s3.send(new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filename,
    }));

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", result.ContentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/["\r\n]/g, "_")}"`);
    if (result.ContentLength != null) res.setHeader("Content-Length", result.ContentLength);

    result.Body.pipe(res);
  } catch (error) {
    console.error("Asset download error:", error);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to download file" });
    res.destroy(error);
  }
};
