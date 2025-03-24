const router = require('express').Router();
const Review = require('../models/review.model');
const Movie = require('../models/movie.model');
const User = require('../models/user.model');
const auth = require('../middleware/auth.middleware');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Protect all review routes
router.use(auth);

// Create rate limiter
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many reviews submitted. Please try again later.',
    retryAfter: '15 minutes'
  }
});

const reactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 reactions per minute
  message: {
    error: 'Too many reactions. Please try again later.',
    retryAfter: '1 minute'
  }
});

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username')
      .populate('movie', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Create/Update review
router.post('/', auth, async (req, res) => {
  try {
    const { movieId, rating, comment, recommendation } = req.body;

    // Input validation
    if (!movieId || rating === undefined) {
      return res.status(400).json({ message: 'Movie ID and rating are required' });
    }

    // Validate rating
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    // Find movie
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Find existing review or create new one
    let review = await Review.findOne({
      user: req.user._id,
      movie: movieId
    });

    if (review) {
      // Update existing review
      review.rating = numRating;
      review.comment = comment || '';
      review.recommendation = recommendation;
      await review.save();
    } else {
      // Create new review
      review = new Review({
        user: req.user._id,
        movie: movieId,
        rating: numRating,
        comment: comment || '',
        recommendation
      });
      await review.save();

      // Add review to movie's reviews array if not already present
      if (!movie.reviews.includes(review._id)) {
        movie.reviews.push(review._id);
      }
    }

    // Calculate new average rating
    const allReviews = await Review.find({ movie: movieId });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    // Update movie stats
    movie.rating = Number(averageRating.toFixed(1));
    movie.recommendations = {
      up: allReviews.filter(rev => rev.recommendation === 'up').length,
      down: allReviews.filter(rev => rev.recommendation === 'down').length
    };

    await movie.save();

    // Send response
    res.status(200).json({
      message: 'Review submitted successfully',
      movieStats: {
        rating: movie.rating,
        recommendations: movie.recommendations
      },
      review: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        recommendation: review.recommendation
      }
    });

  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ 
      message: error.code === 11000 
        ? 'You have already reviewed this movie' 
        : 'Error submitting review'
    });
  }
});

// Update a review
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { rating, comment, recommendation } = req.body;
    const reviewId = req.params.reviewId;

    // Find review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Store old recommendation for updating counts
    const oldRecommendation = review.recommendation;

    // Update review
    review.rating = rating;
    review.comment = comment;
    review.recommendation = recommendation;
    await review.save();

    // Update movie's recommendation counts if recommendation changed
    if (oldRecommendation !== recommendation) {
      const movie = await Movie.findById(review.movie);
      if (oldRecommendation) {
        movie.recommendations[oldRecommendation] = Math.max(0, movie.recommendations[oldRecommendation] - 1);
      }
      if (recommendation) {
        movie.recommendations[recommendation] = (movie.recommendations[recommendation] || 0) + 1;
      }
      await movie.save();
    }

    // Return updated review with populated fields
    const updatedReview = await Review.findById(reviewId)
      .populate('user', 'username')
      .populate('movie', 'title');

    res.json(updatedReview);
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const reviewId = req.params.reviewId;

    // Find review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Update movie's recommendation counts and remove review reference
    const movie = await Movie.findById(review.movie);
    if (movie) {
      if (review.recommendation) {
        movie.recommendations[review.recommendation] = Math.max(0, movie.recommendations[review.recommendation] - 1);
      }
      movie.reviews = movie.reviews.filter(r => r.toString() !== reviewId);
      await movie.save();
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// Get reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const reviews = await Review.find({ movie: req.params.movieId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Get user's review for a movie
router.get('/user/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;

    // Validate movieId format
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID format' });
    }

    const review = await Review.findOne({
      movie: movieId,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);

  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      message: 'Error fetching review',
      error: error.message
    });
  }
});

// Get user's reviews
router.get('/user', async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('movie', 'title poster')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Get user's reviews
router.get('/user-reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('movie', 'title');
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Get user reactions
router.get('/user-reactions', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ 
      user: req.user._id,
      recommendation: { $exists: true, $ne: null }
    });
    
    const reactions = reviews.map(review => ({
      movieId: review.movie,
      recommendation: review.recommendation
    }));

    res.json(reactions);
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ message: 'Error fetching reactions' });
  }
});

// Update reaction
router.post('/reaction', auth, async (req, res) => {
  try {
    const { movieId, recommendation } = req.body;

    // Find the movie
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Find existing review or create new one
    let review = await Review.findOne({ user: req.user._id, movie: movieId });
    if (review) {
      // Update existing review
      const oldRecommendation = review.recommendation;
      review.recommendation = recommendation;
      await review.save();

      // Update movie recommendations
      if (oldRecommendation) {
        movie.recommendations[oldRecommendation] = Math.max(0, (movie.recommendations[oldRecommendation] || 0) - 1);
      }
      if (recommendation) {
        movie.recommendations[recommendation] = (movie.recommendations[recommendation] || 0) + 1;
      }
    } else {
      // Create new review
      review = new Review({
        user: req.user._id,
        movie: movieId,
        recommendation
      });
      await review.save();

      // Update movie recommendations
      if (recommendation) {
        movie.recommendations[recommendation] = (movie.recommendations[recommendation] || 0) + 1;
      }
      movie.reviews.push(review._id);
    }

    await movie.save();

    res.json({
      message: 'Reaction updated successfully',
      movie: await Movie.findById(movieId).populate('reviews').lean(),
      userReaction: recommendation
    });

  } catch (error) {
    console.error('Reaction update error:', error);
    res.status(500).json({ message: 'Error updating reaction' });
  }
});

module.exports = router; 