import redis from "../../../shared/redis/redis.js";
import { getFromS3 } from "../utils/getFromS3.js";

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
    const previewUrl = await getFromS3(filename, 600, "inline");
    res.setHeader("Cache-Control", "private, no-store");

    // Browsers generally cannot render PPTX files directly. Let Office Online
    // fetch the short-lived, signed S3 URL for an in-browser presentation preview.
    if (filename.toLowerCase().endsWith(".pptx")) {
      const officePreviewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(previewUrl)}`;
      return res.redirect(302, officePreviewUrl);
    }

    return res.redirect(302, previewUrl);
  } catch (error) {
    console.error("Asset preview error:", error);
    return res.status(500).json({ message: "Failed to preview file" });
  }
};
