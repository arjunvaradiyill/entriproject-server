import express from "express";
import { getUsers, registerUser, loginUser, logoutUser, getUserProfile } from "../controllers/userController.js"; 
import { protect } from "../middleware/authMiddleware.js"; // ✅ Ensure protect is imported
import { deleteReview } from "../controllers/movieController.js"; // ✅ Import deleteReview function

const router = express.Router();

router.get("/", getUsers); // Get all users
router.post("/register", registerUser); // Register user
router.post("/login", loginUser); // Login user
router.get("/profile", protect, getUserProfile); // ✅ Protected route to view profile
router.post("/logout", logoutUser); // Logout user

// ✅ Users can delete their own reviews
router.delete("/review/:reviewId", protect, deleteReview);

export default router;
