const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Test route to check database connection and users
router.get('/test', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    console.log('All users in database:', users);
    res.json({ message: 'Database connected', userCount: users.length, users });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ message: 'Database test failed', error: error.message });
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user with admin status
    const user = new User({
      username,
      email,
      password,
      isAdmin: isAdmin === true // Explicitly convert to boolean
    });

    await user.save();

    // Create session
    req.session.userId = user._id;
    req.session.isAdmin = user.isAdmin; // Add admin status to session

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration',
      error: error.message
    });
  }
});

// GET: Check all users
router.get('/check-users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }))
    });
  } catch (error) {
    console.error('Error checking users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// POST: Create test user
router.post('/setup', async (req, res) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: 'arjunpp@gmail.com' });
    
    if (user) {
      return res.json({
        success: true,
        message: 'Test user already exists',
        user: {
          email: user.email,
          username: user.username
        }
      });
    }

    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    user = new User({
      username: 'arjunpp',
      email: 'arjunpp@gmail.com',
      password: hashedPassword,
      isAdmin: true
    });

    await user.save();

    res.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        email: user.email,
        username: user.username
      },
      credentials: {
        email: 'arjunpp@gmail.com',
        password: '123456'
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test user',
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user and token
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out',
        error: err.message
      });
    }
    res.clearCookie('sessionId');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, email },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Add this route to your existing auth.routes.js
router.get('/check-admin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      isAdmin: user.role === 'admin',
      user: user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a test route to check user data
router.get('/check-user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ 
      email: req.params.email.toLowerCase() 
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User found',
      user: {
        email: user.email,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking user' });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Reset password to '123456'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      email: user.email,
      newPassword: '123456'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// Only configure Google OAuth if environment variables are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (!user) {
          // Create new user if doesn't exist
          user = new User({
            username: profile.displayName,
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-8), // Generate random password
            googleId: profile.id
          });
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));

  // Google auth routes
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Generate JWT token
      const token = jwt.sign(
        { id: req.user._id, isAdmin: req.user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      // Redirect to frontend with token
      res.redirect(`http://localhost:5173/auth-callback?token=${token}`);
    }
  );
} else {
  console.log('Google OAuth is disabled. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables to enable it.');
  
  // Add dummy routes to prevent 404 errors when Google login is clicked
  router.get('/google', (req, res) => {
    res.status(503).json({ 
      message: 'Google authentication is not configured on the server' 
    });
  });
  
  router.get('/google/callback', (req, res) => {
    res.redirect('http://localhost:5173/login?error=google_auth_not_configured');
  });
}

module.exports = router; 