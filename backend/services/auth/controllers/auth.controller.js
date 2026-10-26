import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";
import crypto from "crypto";

const SESSION_SECONDS = 7 * 24 * 60 * 60;
const sessionCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
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

    await redis.set(`user-session-${user._id}`, sessionId, "EX", SESSION_SECONDS)

    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan:user.plan,
        credits:user.credits,
        totalCredits:user.totalCredits,
        planExpiresAt:user.planExpiresAt
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

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.plan = plan;
    user.credits += credits;
    user.totalCredits += credits;
    user.planExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    await user.save();

    const sessionId = await redis.get(`user-session-${user._id}`);

    if (sessionId) {
      await redis.set(
        `session-${sessionId}`,
        JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          plan: user.plan,
          credits: user.credits,
          totalCredits: user.totalCredits,
          planExpiresAt: user.planExpiresAt,
        }),
        "EX",
        SESSION_SECONDS
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update user payment error:", error);
    return res.status(500).json({
      message: "Failed to update user payment",
    });
  }
};

export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body ?? {};

    if (!userId || typeof agent !== "string") {
      return res.status(400).json({ message: "userId and agent are required" });
    }

    const COST = {
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      image: 15,
      vision: 15,
    };

    const requiredCredits = COST[agent];
    if (requiredCredits === undefined) {
      return res.status(400).json({ message: "Invalid agent type" });
    }

    // A single conditional update prevents two concurrent requests from
    // spending the same remaining credits.
    const user = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: requiredCredits } },
      { $inc: { credits: -requiredCredits } },
      { new: true, runValidators: true }
    );

    if (!user) {
      const exists = await User.exists({ _id: userId });
      if (!exists) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(400).json({
        message: "Not enough credits.",
        requiredCredits,
      });
    }

    // Keep the current known session cache in sync. MongoDB remains the
    // source of truth for the balance.
    try {
      const sessionId = await redis.get(`user-session-${user._id}`);
      if (sessionId) {
        const sessionKey = `session-${sessionId}`;
        const sessionValue = await redis.get(sessionKey);
        if (sessionValue) {
          const session = JSON.parse(sessionValue);
          await redis.set(
            sessionKey,
            JSON.stringify({ ...session, credits: user.credits }),
            "EX",
            SESSION_SECONDS
          );
        }
      }
    } catch (sessionError) {
      // MongoDB is authoritative. A cache failure must not turn a completed
      // deduction into a reported failure that could trigger unsafe retries.
      console.error("Credit deduction succeeded but session cache update failed:", sessionError);
    }

    return res.status(200).json({
      success: true,
      credits: user.credits,
      deductedCredits: requiredCredits,
      agent,
    });
  } catch (error) {
    console.error("Deduct credits error:", error);
    return res.status(500).json({ message: "Failed to deduct credits" });
  }
}