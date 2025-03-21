import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true }
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  poster: { type: String, required: true },
  rating: { type: Number, required: true },
  reviews: [reviewSchema] // Array of reviews
});

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
