import express from 'express';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { authMiddleware, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get all rooms (Admin only)
router.get('/rooms', authMiddleware, isAdmin, async (req, res) => {
  try {
    const rooms = await Room.find({})
      .select('-password')
      .populate('admin', 'username')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

export default router;
