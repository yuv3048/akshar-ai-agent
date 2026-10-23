import { downloadFromS3 } from "../utils/downloadFromS3.js";

export const downloadImage = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const image = await downloadFromS3(filename);

    if (!image.Body) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.setHeader(
      "Content-Type",
      image.ContentType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/["\r\n]/g, "_")}"`
    );
    res.setHeader("Cache-Control", "private, no-store");

    image.Body.on("error", (error) => {
      console.error("S3 image stream error:", error);

      if (!res.headersSent) {
        res.status(500).end("Failed to download image");
      } else {
        res.destroy(error);
      }
    });

    image.Body.pipe(res);
  } catch (error) {
    console.error("Image download error:", error);

    if (!res.headersSent) {
      const status = error.name === "NoSuchKey" ? 404 : 500;
      return res.status(status).json({
        message: status === 404 ? "Image not found" : "Failed to download image",
      });
    }
  }
};
