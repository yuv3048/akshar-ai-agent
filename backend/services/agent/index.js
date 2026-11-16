import "dotenv/config";

import express from "express";
import connectDb from "./config/db.js";
import router from "./routes/agent.route.js"


const Port = process.env.PORT 

const app = express();

app.use(express.json());

app.use("/", router)

app.get("/",(req,res)=>{
    res.json({
        message:"hello from agent!"
    })
})

app.listen(Port , ()=>{
    console.log(`agent started on ${Port}`);
    connectDb();
})