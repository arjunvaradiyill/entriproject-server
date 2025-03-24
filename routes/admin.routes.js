const router = require('express').Router();
const User = require('../models/user.model');
const Movie = require('../models/movie.model');
const Review = require('../models/review.model');
const { adminAuth } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Protect all admin routes
router.use(adminAuth);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, movieCount] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        userCount,
        movieCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalMovies = await Movie.countDocuments();
    let totalReviews = 0;

    // Get total reviews count
    const movies = await Movie.find();
    movies.forEach(movie => {
      totalReviews += movie.reviews.length;
    });

    // Get recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent reviews
    const recentReviews = [];
    for (const movie of movies) {
      movie.reviews.slice(-5).forEach(review => {
        recentReviews.push({
          _id: review._id,
          movieTitle: movie.title,
          user: review.user,
          comment: review.comment,
          rating: review.rating,
          createdAt: review.createdAt
        });
      });
    }

    // Sort recent reviews by date
    recentReviews.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
      totalUsers,
      totalMovies,
      totalReviews,
      recentUsers,
      recentReviews: recentReviews.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Admin login (public route)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Find admin user
        const user = await User.findOne({ email, isAdmin: true });
        if (!user) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, isAdmin: true },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create first admin (public route, should be disabled in production)
router.post('/create-first-admin', async (req, res) => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ isAdmin: true });
        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = new User({
            email: 'admin@example.com',
            password: hashedPassword,
            username: 'admin',
            isAdmin: true
        });

        await admin.save();

        res.json({ 
            message: 'Admin created successfully',
            credentials: {
                email: 'admin@example.com',
                password: 'admin123'
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 