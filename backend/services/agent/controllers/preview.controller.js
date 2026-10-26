import { GetObjectCommand } from "@aws-sdk/client-s3";
import redis from "../../../shared/redis/redis.js";
import { s3 } from "../config/s3.js";
import { getFromS3 } from "../utils/getFromS3.js";

const contentTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export const previewAsset = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { filename } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!filename || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(filename)) {
      return res.status(404).json({ message: "File not found" });
    }

    const cachedAsset = await redis.get(`asset:${filename}`);
    if (!cachedAsset) {
      return res.status(404).json({ message: "Preview link expired or file not found" });
    }

    const asset = JSON.parse(cachedAsset);
    if (String(asset?.userId) !== String(userId)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader("Cache-Control", "private, no-store");

    // Office Online needs a reachable URL for PPTX files, so retain the signed URL flow.
    if (filename.toLowerCase().endsWith(".pptx")) {
      const previewUrl = await getFromS3(filename, 600, "inline");
      const officePreviewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(previewUrl)}`;
      return res.redirect(302, officePreviewUrl);
    }

    const result = await s3.send(new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filename,
    }));

    const extension = filename.match(/\.[^.]+$/)?.[0]?.toLowerCase();
    res.setHeader("Content-Type", contentTypes[extension] || result.ContentType || "application/octet-stream");
    if (result.ContentLength != null) res.setHeader("Content-Length", result.ContentLength);
    res.setHeader("Content-Disposition", `inline; filename="${filename.replace(/["\r\n]/g, "_")}"`);

    result.Body.pipe(res);
  } catch (error) {
    console.error("Asset preview error:", error);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to preview file" });
    res.destroy(error);
  }
};
