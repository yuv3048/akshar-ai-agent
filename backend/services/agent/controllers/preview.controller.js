import redis from "../../../shared/redis/redis.js";

export const previewAsset = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(filename)) {
      return res.status(404).json({ message: "File not found" });
    }

    const cachedAsset = await redis.get(`asset:${filename}`);

    if (!cachedAsset) {
      return res.status(404).json({
        message: "Preview link expired or file not found",
      });
    }

    const asset = JSON.parse(cachedAsset);

    if (!asset?.previewUrl) {
      return res.status(404).json({ message: "Preview not available" });
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.redirect(302, asset.previewUrl);
  } catch (error) {
    console.error("Asset preview error:", error);

    return res.status(500).json({
      message: "Failed to preview file",
    });
  }
};
