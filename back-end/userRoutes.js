// userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./user'); // User model

const router = express.Router();

const jwt = require('jsonwebtoken'); //for JWT generato
const authenticateToken = require('../middleware/auth');


// POST route to sign up a new user
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET route to retrieve user details
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST route to update user details
router.post('/user/:id/update', async (req, res) => {
  const { username, email, profilePicture, password } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username;
    if (email) user.email = email;
    if (profilePicture) user.profilePicture = profilePicture;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST route for login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('logging password',password);
    console.log('logging DBpassword',user.password);
    console.log('logging DBpassword',bcrypt.hash(password, 10));
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    // Respond with the token and user details
    res.status(200).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET route to retrieve user details (protected)
router.get('/user/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//test protected route
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You have access to this protected route!', user: req.user });
});

// POST route to log out a user
router.post('/logout', (req, res) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  tokenBlacklist.push(token);
  res.status(200).json({ message: 'Successfully logged out' });
});

// Middleware to check for blacklisted tokens
const isTokenBlacklisted = (req, res, next) => {
  const token = req.header('Authorization');
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ message: 'Token is blacklisted. Please log in again.' });
  }
  next();
};



module.exports = router;
