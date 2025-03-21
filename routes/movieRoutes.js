import express from "express";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";

const router = express.Router();

// ➤ POST: Add a new movie
router.post("/add", async (req, res) => {
  try {
    const { title, description, poster, rating, reviews } = req.body;

    if (!title || !description || !poster || rating === undefined) {
      return res.status(400).json({ message: "Missing required fields: title, description, poster, or rating" });
    }

    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 0 and 5" });
    }

    const formattedReviews = Array.isArray(reviews)
      ? reviews.filter(review => review.user && review.comment && review.rating !== undefined)
      : [];

    const movie = new Movie({ title, description, poster, rating, reviews: formattedReviews });
    await movie.save();

    res.status(201).json({ message: "Movie added successfully", movie });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ➤ GET: Fetch all movies (sorted by latest first)
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ➤ POST: Add a Review to a Movie (Fixed)
router.post("/:id/add-review", async (req, res) => {
  try {
    const { user, comment, rating } = req.body;
    const movieId = req.params.id;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }

    if (!user || !comment || rating === undefined) {
      return res.status(400).json({ message: "User, comment, and rating are required!" });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    if (!user.trim() || !comment.trim()) {
      return res.status(400).json({ message: "User and comment cannot be empty" });
    }

    // Update only the reviews array
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { $push: { reviews: { user, comment, rating } } }, // Push new review to reviews array
      { new: true, runValidators: true } // Ensure validation for new reviews only
    );

    if (!movie) {
      return res.status(404).json({ message: "Movie not found!" });
    }

    res.status(200).json({ message: "Review added successfully", movie });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
