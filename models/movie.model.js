const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  }
}, { timestamps: true });

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  backdrop: {
    type: String,
    default: ''
  },
  year: {
    type: Number
  },
  runtime: {
    type: String
  },
  director: {
    type: String
  },
  cast: [String],
  genres: [String],
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  trending: {
    type: Boolean,
    default: false
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Add text index for search
movieSchema.index({ title: 'text', description: 'text' });

// Calculate average rating before saving
movieSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    this.averageRating = this.reviews.reduce((acc, review) => acc + review.rating, 0) / this.reviews.length;
  }
  next();
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie; 