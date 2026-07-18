import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/cloudinary.js';
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' }
});

const validateAuthInput = (data, isLogin = false) => {
  const errors = {};
  
  const email = data.email?.trim() || '';
  const password = data.password || '';
  const username = data.username?.trim() || '';
  const confirmPassword = data.confirmPassword || '';

  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (!isLogin) {
    if (password.length < 8) errors.password = 'Password must be at least 8 characters long.';
    else if (!/(?=.*[a-z])/.test(password)) errors.password = 'Password must contain at least one lowercase letter.';
    else if (!/(?=.*[A-Z])/.test(password)) errors.password = 'Password must contain at least one uppercase letter.';
    else if (!/(?=.*\d)/.test(password)) errors.password = 'Password must contain at least one number.';
    else if (!/(?=.*[!@#$%^&*])/.test(password)) errors.password = 'Password must contain at least one special character.';
  }

  if (!isLogin) {
    if (!username) errors.username = 'Username is required.';
    else if (username.length < 3 || username.length > 20) errors.username = 'Username must be between 3 and 20 characters.';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Username can only contain letters, numbers, and underscores.';

    if (!confirmPassword) errors.confirmPassword = 'Confirm Password is required.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  }

  return { errors, isValid: Object.keys(errors).length === 0, sanitized: { username, email: email.toLowerCase(), password } };
};

// Register a new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { errors, isValid, sanitized } = validateAuthInput(req.body, false);
    if (!isValid) return res.status(400).json({ errors });

    const { username, email, password } = sanitized;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ errors: { email: 'Email is already in use.' } });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ errors: { username: 'Username is already taken.' } });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { errors, isValid, sanitized } = validateAuthInput(req.body, true);
    if (!isValid) return res.status(400).json({ errors });

    const { email, password } = sanitized;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
router.put('/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { interests } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (interests !== undefined) {
      // Handle form-data which might send arrays in different formats
      let parsedInterests = interests;
      if (typeof interests === 'string') {
        try {
          parsedInterests = JSON.parse(interests);
        } catch (e) {
          parsedInterests = interests.split(',').map(i => i.trim()).filter(Boolean);
        }
      }
      updateData.interests = Array.isArray(parsedInterests) ? parsedInterests : [parsedInterests];
    }

    if (req.file && req.file.path) {
      updateData.avatar = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after' }).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        isAdmin: updatedUser.isAdmin,
        interests: updatedUser.interests,
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

export default router;
