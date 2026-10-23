import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export const downloadFromS3 = async (key) => {
  return await s3.send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })
  );
};
