import redis from "../../shared/redis/redis.js"

const protect = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session;

    console.log("Request:", req.method, req.originalUrl);
    console.log("Cookie received:", Boolean(sessionId));

    if (!sessionId) {
      return res.status(401).json({ message: "unauthorized" });
    }

    const session = await redis.get(`session-${sessionId}`);

    console.log("Redis session found:", Boolean(session));

    if (!session) {
      return res.status(401).json({ message: "session expired" });
    }

    req.user = JSON.parse(session);
    next();
  } catch (error) {
    console.error("Protect error:", error);
    return res.status(500).json({ message: `protect error ${error}` });
  }
};

export default protect