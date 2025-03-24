const router = require('express').Router();
const mongoose = require('mongoose');
const Movie = require('../models/movie.model');
const User = require('../models/user.model');

// Check database connection
router.get('/db-status', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const movieCount = await Movie.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({
      dbState: states[dbState],
      connected: dbState === 1,
      collections: {
        movies: movieCount,
        users: userCount
      }
    });
  } catch (error) {
    console.error('Database status check error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 