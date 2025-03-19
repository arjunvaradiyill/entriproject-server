import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { type: String, required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
});

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviews: [reviewSchema]
});

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;
