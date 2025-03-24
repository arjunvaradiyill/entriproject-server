const router = require('express').Router();
const Movie = require('../models/movie.model');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes - no auth required
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected routes - auth required
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    console.log(`Adding review to movie ${req.params.id}:`, { rating, comment });
    
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }
    
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Check if user already reviewed this movie
    const existingReview = movie.reviews.find(
      review => review.user && review.user.toString() === req.user.id
    );
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this movie' });
    }
    
    // Add the review
    movie.reviews.push({
      user: req.user.id,
      username: req.user.username,
      rating,
      comment
    });
    
    await movie.save();
    console.log('Review added successfully');
    
    // Return updated movie with populated user data
    const updatedMovie = await Movie.findById(req.params.id)
      .populate('reviews.user', 'username');
    
    res.status(201).json(updatedMovie);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    const movie = new Movie({
      title,
      description,
      imageUrl
    });
    await movie.save();
    res.json(movie);
  } catch (error) {
    console.error('Create movie error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all movies with filters and search
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      genre, 
      sort = 'latest',
      page = 1,
      limit = 10
    } = req.query;

    let query = {};
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Genre filter
    if (genre) {
      query.genres = genre;
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'rating':
        sortOption = { averageRating: -1 };
        break;
      case 'views':
        sortOption = { views: -1 };
        break;
      case 'oldest':
        sortOption = { releaseDate: 1 };
        break;
      default: // 'latest'
        sortOption = { releaseDate: -1 };
    }

    const movies = await Movie.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments(query);

    res.json({
      movies,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });

  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      message: 'Error fetching movies',
      error: error.message
    });
  }
});

// Get trending movies - change the route to avoid conflict
router.get('/trending', async (req, res) => {
  try {
    const trendingMovies = await Movie.find({ trending: true })
      .sort({ views: -1 })
      .limit(10);

    res.json({
      movies: trendingMovies
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching trending movies',
      error: error.message
    });
  }
});

// Get a single movie by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching movie with ID: ${req.params.id}`);
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      console.log(`Movie with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    console.log(`Found movie: ${movie.title}`);
    res.json(movie);
  } catch (error) {
    console.error(`Error fetching movie ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get all movies
router.get('/all', auth, async (req, res) => {
  try {
    const movies = await Movie.find()
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'username'
        }
      })
      .sort({ createdAt: -1 });

    // Log the first movie to check the data structure
    console.log('Sample movie:', movies[0]);

    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ 
      message: 'Error fetching movies',
      error: error.message 
    });
  }
});

// Update movie (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie updated successfully',
      movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating movie',
      error: error.message
    });
  }
});

// Delete movie (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting movie',
      error: error.message
    });
  }
});

// Add a movie
router.post('/', async (req, res) => {
  try {
    const newMovie = new Movie(req.body);
    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'Error adding movie' });
  }
});

// Add a test movie (for debugging)
router.post('/test', async (req, res) => {
  try {
    const testMovie = {
      title: "Interstellar",
      poster: "https://i.pinimg.com/474x/f0/0e/f4/f00ef4ef28062a3ffe32c80cfa039c86.jpg",
      rating: 8.6,
      reviews: [
        "A thought-provoking sci-fi epic.",
        "Nolan delivers another masterpiece.",
        {
          user: "Anonymous",
          comment: "super",
          rating: 5
        }
      ]
    };

    const movie = new Movie(testMovie);
    const savedMovie = await movie.save();
    console.log('Test movie saved:', savedMovie); // Debug log
    res.status(201).json(savedMovie);
  } catch (error) {
    console.error('Error adding test movie:', error);
    res.status(500).json({ message: 'Error adding test movie' });
  }
});

// Get movie genres
router.get('/genres/all', async (req, res) => {
  try {
    const genres = await Movie.distinct('genre');
    res.json({
      success: true,
      genres
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching genres',
      error: error.message
    });
  }
});

// Add a new movie (Protected - Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    // Debug log
    console.log('Request body:', req.body);

    // Destructure and validate all required fields
    const {
      title,
      description,
      releaseDate,
      genre,
      director,
      poster,
      trailer,
      trending = false
    } = req.body;

    // Check if all required fields are present
    if (!title || !description || !releaseDate || !genre || !director || !poster || !trailer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: {
          title: !title,
          description: !description,
          releaseDate: !releaseDate,
          genre: !genre,
          director: !director,
          poster: !poster,
          trailer: !trailer
        }
      });
    }

    // Validate date format
    const validDate = new Date(releaseDate);
    if (isNaN(validDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid release date format. Use YYYY-MM-DD'
      });
    }

    // Validate genre format
    const genreArray = Array.isArray(genre) ? genre : [genre];
    if (genreArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one genre is required'
      });
    }

    // Create new movie with validated data
    const movie = new Movie({
      title: title.trim(),
      description: description.trim(),
      releaseDate: validDate,
      genre: genreArray,
      director: director.trim(),
      poster: poster.trim(),
      trailer: trailer.trim(),
      trending
    });

    // Save movie to database
    const savedMovie = await movie.save();
    console.log('Movie saved successfully:', savedMovie);

    res.status(201).json({
      success: true,
      message: 'Movie added successfully',
      movie: savedMovie
    });

  } catch (error) {
    console.error('Create movie error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Error adding movie',
      error: error.message
    });
  }
});

// Get all movies with filters (Public)
router.get('/', async (req, res) => {
  try {
    const { search, genre, sort = 'latest', page = 1, limit = 8 } = req.query;
    
    let query = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (genre) {
      query.genre = genre;
    }

    let sortOptions = {};
    switch (sort) {
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'views':
        sortOptions = { views: -1 };
        break;
      default:
        sortOptions = { releaseDate: -1 };
    }

    const skip = (page - 1) * limit;

    const [movies, total] = await Promise.all([
      Movie.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Movie.countDocuments(query)
    ]);

    res.json({
      success: true,
      movies,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movies',
      error: error.message
    });
  }
});

// Get trending movies (Public)
router.get('/trending', async (req, res) => {
  try {
    const movies = await Movie.find({ trending: true })
      .sort({ releaseDate: -1 })
      .limit(4);

    res.json({
      success: true,
      movies
    });
  } catch (error) {
    console.error('Get trending movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending movies',
      error: error.message
    });
  }
});

// Add a test movie (for debugging)
router.post('/test-movie', async (req, res) => {
  try {
    const testMovie = {
      title: "Test Movie",
      poster: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
      description: "This is a test movie added via API",
      year: 2023,
      runtime: "120 min",
      director: "Test Director",
      cast: ["Actor 1", "Actor 2"],
      genres: ["Action", "Drama"],
      rating: 4.5
    };
    
    const movie = new Movie(testMovie);
    await movie.save();
    
    res.status(201).json({ message: "Test movie added successfully", movie });
  } catch (error) {
    console.error("Error adding test movie:", error);
    res.status(500).json({ message: "Error adding test movie", error: error.message });
  }
});

// Add this diagnostic route
router.get('/debug/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('reviews.user', 'username');
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json({
      title: movie.title,
      reviewCount: movie.reviews.length,
      reviews: movie.reviews.map(r => ({
        user: r.user ? r.user.username : 'Unknown',
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this route to check all available movies
router.get('/all-ids', async (req, res) => {
  try {
    const movies = await Movie.find().select('_id title');
    res.json({
      count: movies.length,
      movies: movies.map(m => ({ id: m._id, title: m.title }))
    });
  } catch (error) {
    console.error('Error fetching movie IDs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add sample movies for testing
router.post('/sample-data', async (req, res) => {
  try {
    const sampleMovies = [
      {
        title: "Inception",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
        backdrop: "https://wallpaperaccess.com/full/1264514.jpg",
        year: 2010,
        runtime: "148 min",
        director: "Christopher Nolan",
        cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page"],
        genres: ["Action", "Adventure", "Sci-Fi"],
        reviews: []
      },
      {
        title: "The Shawshank Redemption",
        description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        poster: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop: "https://wallpapercave.com/wp/wp2014257.jpg",
        year: 1994,
        runtime: "142 min",
        director: "Frank Darabont",
        cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
        genres: ["Drama"],
        reviews: []
      },
      {
        title: "The Dark Knight",
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg",
        backdrop: "https://wallpapercave.com/wp/wp2162756.jpg",
        year: 2008,
        runtime: "152 min",
        director: "Christopher Nolan",
        cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
        genres: ["Action", "Crime", "Drama"],
        reviews: []
      }
    ];

    const result = await Movie.insertMany(sampleMovies);
    
    res.status(201).json({
      message: `${result.length} sample movies added successfully`,
      movies: result.map(m => ({ id: m._id, title: m.title }))
    });
  } catch (error) {
    console.error('Error adding sample movies:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 