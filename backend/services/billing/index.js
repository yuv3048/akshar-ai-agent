import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import router from "./routes/billing.route.js";

dotenv.config()

const Port = process.env.PORT 

const app = express();

app.use(express.json())

app.use("/", router)


app.get("/",(req,res)=>{
    res.json({
        message:"hello from billing!"
    })
})

app.listen(Port , ()=>{
    console.log(`billing started on ${Port}`);
    connectDb();
})