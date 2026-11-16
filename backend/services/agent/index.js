import "dotenv/config";

import express from "express";
import connectDb from "./config/db.js";
import router from "./routes/agent.route.js"


const Port = process.env.PORT 

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use("/", router)

app.get("/health", (req, res) => {
    res.status(200).json({
        service: "akshar-ai-agent",
        status: "ok",
        capabilities: {
            vision: Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN && process.env.AGENT_SERVICE_SECRET),
        },
    });
});

app.get("/",(req,res)=>{
    res.json({
        message:"hello from agent!"
    })
})

app.listen(Port , ()=>{
    console.log(`agent started on ${Port}`);
    connectDb();
})