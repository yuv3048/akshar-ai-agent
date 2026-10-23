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
    return res.redirect(302, previewUrl);
  } catch (error) {
    console.error("Asset preview error:", error);
    return res.status(500).json({ message: "Failed to preview file" });
  }
};
