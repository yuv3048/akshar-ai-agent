import express from "express";
import { deductCredits, logIn, logOut, updateUserPayment } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", logIn);
router.get("/logout",logOut);
router.post("/update-plan", updateUserPayment);
router.post("/deduct-credits", deductCredits);

export default router