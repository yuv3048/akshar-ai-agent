import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";

const SESSION_SECONDS = 7 * 24 * 60 * 60;
const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: SESSION_SECONDS * 1000,
};

export const logIn = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({ firebaseUID: decoded.uid });

    if (!user) {
      user = await User.create({
        firebaseUID: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
    }

    const sessionId = crypto.randomUUID();
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }),
      "EX",
      SESSION_SECONDS
    );

    res.cookie("session", sessionId, sessionCookieOptions);
    return res.status(200).json(user);
  } catch (error) {
    console.error("Login error:", error.message || error);
    return res.status(401).json({ message: "Login failed" });
  }
};

export const logOut = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;
    if (sessionId) await redis.del(`session-${sessionId}`);

    res.clearCookie("session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error.message || error);
    return res.status(500).json({ message: "Logout failed" });
  }
};
