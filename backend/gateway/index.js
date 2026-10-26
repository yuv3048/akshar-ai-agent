import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getCurrentUser } from "./controllers/user.controller.js";
import protect from "./middleware/auth.middleware.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan";

dotenv.config()

const Port = process.env.PORT 

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.1.9:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(cookieParser())

app.use(morgan("dev"));

app.use("/api/auth",proxy(process.env.AUTH_SERVICE_URL));

app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE_URL));

app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE_URL));

app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE_URL));

app.get("/api/me", protect ,getCurrentUser);

app.get("/",(req,res)=>{
    res.json({
        message:"hello from gateway!"
    })
})

app.listen(Port , "0.0.0.0", ()=>{
    console.log(`gateway started on ${Port}`)
})