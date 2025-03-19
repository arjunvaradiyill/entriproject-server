import Movie from "../models/movieModel.js";

// ✅ Add a new movie (Admin only)
export const addMovie = async (req, res) => {
    try {
        const { title, description, rating } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        const movie = new Movie({ title, description, rating });
        await movie.save();

        res.status(201).json({ message: "Movie added successfully", movie });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Add a review to a movie
export const addMovieReview = async (req, res) => {
    try {
        const { movieId, comment, rating } = req.body;

        // Ensure the user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }

        // Add review with user info from token
        const review = {
            user: req.user.id, // Get user ID from token
            comment,
            rating
        };

        movie.reviews.push(review);

        // ✅ Calculate new average rating
        const totalRatings = movie.reviews.reduce((sum, review) => sum + review.rating, 0);
        movie.rating = totalRatings / movie.reviews.length;

        await movie.save();

        res.json({ message: "Review added successfully", movie });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// ✅ Delete a user's review
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id; // ✅ Get logged-in user's ID

        // Find the movie that contains the review
        const movie = await Movie.findOne({ "reviews._id": reviewId });
        if (!movie) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Find the review inside the movie
        const review = movie.reviews.id(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // ✅ Ensure the user owns the review before deleting
        if (review.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only delete your own reviews" });
        }

        // Remove the review and save the movie
        review.remove();
        await movie.save();

        res.json({ message: "Review deleted successfully", movie });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
