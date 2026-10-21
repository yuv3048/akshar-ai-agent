import express from "express";
import { logIn, logOut } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", logIn);
router.get("/logout",logOut);

export default router