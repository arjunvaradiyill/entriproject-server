import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  reviews: [{ user: String, review: String, rating: Number }],
});

export default mongoose.model("Movie", MovieSchema);
