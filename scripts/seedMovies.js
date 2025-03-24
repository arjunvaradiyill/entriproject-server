const mongoose = require('mongoose');
const Movie = require('../models/movie.model');
require('dotenv').config();

const sampleMovies = [
  {
    title: "Inception",
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    releaseDate: "2010-07-16",
    genre: ["Action", "Sci-Fi", "Adventure"],
    director: "Christopher Nolan",
    poster: "https://image.tmdb.org/t/p/w500/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg",
    trailer: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    trending: true
  },
  {
    title: "The Shawshank Redemption",
    description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    releaseDate: "1994-09-23",
    genre: ["Drama"],
    director: "Frank Darabont",
    poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    trailer: "https://www.youtube.com/watch?v=6hB3S9bIaco",
    trending: true
  },
  {
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    releaseDate: "2008-07-18",
    genre: ["Action", "Drama", "Thriller"],
    director: "Christopher Nolan",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    trailer: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    trending: true
  },
  {
    title: "Pulp Fiction",
    description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    releaseDate: "1994-10-14",
    genre: ["Crime", "Drama"],
    director: "Quentin Tarantino",
    poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    trailer: "https://www.youtube.com/watch?v=s7EdQ4FqbhY",
    trending: false
  },
  {
    title: "The Matrix",
    description: "A computer programmer discovers that reality as he knows it is a simulation created by machines, and joins a rebellion to break free.",
    releaseDate: "1999-03-31",
    genre: ["Action", "Sci-Fi"],
    director: "Lana Wachowski",
    poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    trailer: "https://www.youtube.com/watch?v=vKQi3bBA1y8",
    trending: true
  }
];

const seedMovies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing movies
    await Movie.deleteMany({});
    console.log('Cleared existing movies');

    // Insert new movies
    const movies = await Movie.insertMany(sampleMovies);
    console.log(`Added ${movies.length} movies to the database`);

    // Add some sample reviews
    const sampleReviews = [
      {
        user: "65e1663e75dd2df5d3e903a4", // Replace with an actual user ID from your database
        username: "arjunvaradiyil",
        rating: 5,
        comment: "A masterpiece of modern cinema!"
      },
      {
        user: "67e13e396f0749d041da196d", // Replace with another user ID
        username: "CHIKKU",
        rating: 4,
        comment: "Incredible visual effects and story!"
      }
    ];

    // Add reviews to the first movie
    const firstMovie = await Movie.findOne();
    firstMovie.reviews.push(...sampleReviews);
    await firstMovie.save();

    console.log('Added sample reviews');
    console.log('Database seeding completed!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedMovies(); 