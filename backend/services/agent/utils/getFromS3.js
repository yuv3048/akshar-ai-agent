import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export const getFromS3 = async (filename, expiresIn = 600, disposition = "attachment") => {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filename,
      ResponseContentDisposition: `${disposition}; filename="${filename.replace(/["\\r\\n]/g, "_")}"`,
    }),
    { expiresIn }
  );
};
