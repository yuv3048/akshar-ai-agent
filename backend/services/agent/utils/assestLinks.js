import { createHmac, timingSafeEqual } from "node:crypto";

const getSecret = () => {
  const secret = process.env.ASSET_LINK_SECRET;

  if (!secret) {
    throw new Error("ASSET_LINK_SECRET is not configured");
  }

  return secret;
};

const sign = (filename, mode, expires) => {
  return createHmac("sha256", getSecret())
    .update(`${filename}:${mode}:${expires}`)
    .digest("hex");
};

export const createAssetUrl = (
  filename,
  mode,
  ttlSeconds = 600
) => {
  if (!["preview", "download"].includes(mode)) {
    throw new Error("Invalid asset action");
  }

  const baseUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error("BACKEND_URL is not configured");
  }

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = sign(filename, mode, expires);

  const query = new URLSearchParams({
    expires: String(expires),
    sig: signature,
  });

  return (
    `${baseUrl}/api/agent/assets/` +
    `${encodeURIComponent(filename)}/${mode}?${query}`
  );
};

export const verifyAssetUrl = (
  filename,
  mode,
  expires,
  signature
) => {
  if (
    !["preview", "download"].includes(mode) ||
    !Number.isSafeInteger(expires) ||
    expires <= Math.floor(Date.now() / 1000) ||
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return false;
  }

  const expected = Buffer.from(
    sign(filename, mode, expires),
    "hex"
  );

  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
};
