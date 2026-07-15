import express from 'express';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all room routes
router.use(authMiddleware);

// Get all rooms (public rooms or rooms where the user is a member)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },
        { members: req.userId }
      ]
    }).populate('admin', 'username').populate('members', 'username');
    
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new room
router.post('/', async (req, res) => {
  try {
    const { name, isPrivate, members } = req.body;

    const newRoom = new Room({
      name,
      isPrivate: isPrivate || false,
      admin: req.userId,
      members: members ? [...members, req.userId] : [req.userId]
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a room
router.get('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if private and user is member
    if (room.isPrivate && !room.members.includes(req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });
      
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
