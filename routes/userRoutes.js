import express from "express";
import { registerUser, loginUser, logoutUser, getUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);  // Ensure this route is present
router.post("/logout", logoutUser);
router.get("/profile", getUserProfile);

export default router;
