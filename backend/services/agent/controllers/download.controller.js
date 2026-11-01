import { GetObjectCommand } from "@aws-sdk/client-s3";
import { pipeline } from "node:stream/promises";
import redis from "../../../shared/redis/redis.js";
import { s3 } from "../config/s3.js";

export const downloadAsset = async (req, res) => {
  let filename = req.params.filename;

  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!filename || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(filename)) {
      return res.status(404).json({ message: "File not found" });
    }

    const cachedAsset = await redis.get(`asset:${filename}`);

    if (!cachedAsset) {
      return res.status(404).json({
        message: "Download link expired or file not found",
      });
    }

    const asset = JSON.parse(cachedAsset);

    if (String(asset?.userId) !== String(userId)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Forward browser range requests so interrupted downloads can resume.
    const range = req.headers.range;

    if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) {
      return res.status(416).json({ message: "Invalid download range" });
    }

    const result = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        ...(range ? { Range: range } : {}),
      })
    );

    if (!result.Body) {
      return res.status(502).json({
        message: "Empty file received from storage",
      });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader(
      "Content-Type",
      result.ContentType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/["\r\n]/g, "_")}"`
    );

    if (result.ContentLength != null) {
      res.setHeader("Content-Length", result.ContentLength);
    }

    if (result.ContentRange) {
      res.status(206);
      res.setHeader("Content-Range", result.ContentRange);
    }

    // pipeline() forwards stream errors and cleans up both streams on disconnect.
    await pipeline(result.Body, res);
  } catch (error) {
    // A browser may cancel a request when the user pauses/restarts a download.
    if (req.aborted || res.destroyed || error.code === "ERR_STREAM_PREMATURE_CLOSE") {
      console.warn("Download stream closed:", filename, error.message);
      return;
    }

    console.error("Asset download error:", {
      filename,
      message: error.message,
      code: error.code,
      name: error.name,
    });

    if (!res.headersSent) {
      const status = error.name === "InvalidRange" ? 416 : 502;
      return res.status(status).json({
        message:
          status === 416
            ? "Requested download range is not satisfiable"
            : "Failed to download file. Please try again.",
      });
    }

    // Do not re-emit the stream error on ServerResponse.
    if (!res.destroyed) res.destroy();
  }
};
