import express from "express";
import { addMovie, addMovieReview } from "../controllers/movieController.js";
import { protect } from "../middleware/authMiddleware.js"; // Only 'protect' needed

const router = express.Router();

// ✅ Admin-only route to add movies
router.post("/add", protect, addMovie); // Only admins should add movies

// ✅ Users can add reviews (no admin check, only authentication)
router.post("/add-review", protect, addMovieReview);

export default router;
