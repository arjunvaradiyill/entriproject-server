const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  recommendation: {
    type: String,
    enum: ['up', 'down', null],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure one review per user per movie
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

// Add index for better query performance
reviewSchema.index({ movie: 1, rating: -1 });
reviewSchema.index({ movie: 1, createdAt: -1 });

// Pre-save middleware to handle empty strings and null values
reviewSchema.pre('save', function(next) {
  if (this.comment === '') {
    this.comment = undefined;
  }
  if (this.recommendation === '') {
    this.recommendation = null;
  }
  next();
});

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 