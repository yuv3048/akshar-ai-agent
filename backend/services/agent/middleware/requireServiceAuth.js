import { timingSafeEqual } from "node:crypto";

export function requireServiceAuth(req, res, next) {
  const secret = process.env.AGENT_SERVICE_SECRET;
  const authorization = req.headers.authorization || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!secret || !supplied) {
    return res.status(503).json({ message: "Agent service authentication is not configured." });
  }

  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  const valid = expectedBytes.length === suppliedBytes.length
    && timingSafeEqual(expectedBytes, suppliedBytes);

  if (!valid) {
    return res.status(401).json({ message: "Unauthorized service request." });
  }

  return next();
}
