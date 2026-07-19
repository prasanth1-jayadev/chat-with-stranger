import express from 'express';
import bcrypt from 'bcrypt';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all room routes
router.use(authMiddleware);

// Get all DMs for the user
router.get('/dms', async (req, res) => {
  try {
    const dms = await Room.find({ isDM: true, members: req.userId })
      .populate('members', 'username avatar isOnline');
    res.json(dms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching DMs' });
  }
});

// Create or get DM with a specific user
router.post('/dms/:userId', async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    
    // Check if DM already exists
    const existingDM = await Room.findOne({
      isDM: true,
      members: { $all: [req.userId, targetUserId] }
    }).populate('members', 'username avatar isOnline');

    if (existingDM) {
      return res.json(existingDM);
    }

    // Create new DM
    const newDM = new Room({
      name: 'DM',
      isPrivate: true,
      isDM: true,
      members: [req.userId, targetUserId]
    });

    await newDM.save();
    const populatedDM = await Room.findById(newDM._id).populate('members', 'username avatar isOnline');
    res.status(201).json(populatedDM);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating DM' });
  }
});

// Get all rooms (public rooms or rooms where the user is a member)
router.get('/', async (req, res) => {
  try {
    // Return all non-DM rooms so they can be discovered, but exclude the password hash
    const rooms = await Room.find({ isDM: { $ne: true } })
      .select('-password')
      .populate('admin', 'username')
      .populate('members', 'username');
    
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new room
router.post('/', async (req, res) => {
  try {
    const { name, isPrivate, members, description, tags, password, requiresApproval, logoUrl } = req.body;

    if (isPrivate && !password) {
      return res.status(400).json({ message: 'Password is required for private rooms.' });
    }

    let hashedPassword = undefined;
    if (isPrivate && password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newRoom = new Room({
      name,
      isPrivate: isPrivate || false,
      admin: req.userId,
      members: members ? [...members, req.userId] : [req.userId],
      description: description || '',
      tags: tags || [],
      password: hashedPassword,
      requiresApproval: isPrivate ? (requiresApproval || false) : false,
      logoUrl: logoUrl || ''
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a private room with password
router.post('/:id/join', async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isPrivate) {
      // If it's a public room, just add them
      if (!room.members.includes(req.userId)) {
        room.members.push(req.userId);
        await room.save();
      }
      return res.json({ message: 'Joined successfully' });
    }

    if (room.members.length >= 50) {
      return res.status(400).json({ message: 'Private room is full (max 50 members).' });
    }

    // Verify password for private room
    const isMatch = await bcrypt.compare(password, room.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // If password is correct, add them to pending approvals
    if (!room.members.includes(req.userId) && !room.pendingApprovals.includes(req.userId)) {
      room.pendingApprovals.push(req.userId);
      await room.save();
    }
    return res.json({ status: 'pending', message: 'Request sent for approval. The admin will review it.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error joining room' });
  }
});

// Request access to a room (without password)
router.post('/:id/request-access', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.requiresApproval) {
      return res.status(400).json({ message: 'This room does not accept join requests.' });
    }

    if (room.isPrivate && room.members.length >= 50) {
      return res.status(400).json({ message: 'Cannot request access: Private room is full (max 50 members).' });
    }

    if (room.members.includes(req.userId)) {
      return res.status(400).json({ message: 'You are already a member.' });
    }

    if (!room.pendingApprovals.includes(req.userId)) {
      room.pendingApprovals.push(req.userId);
      await room.save();
    }
    
    res.json({ message: 'Request sent to admin for approval', status: 'pending' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error joining room' });
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

// Get pending requests for a room (Admin only)
router.get('/:id/requests', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('pendingApprovals', 'username avatar');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.admin.toString() !== req.userId) return res.status(403).json({ message: 'Not authorized' });

    res.json(room.pendingApprovals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve user
router.post('/:id/approve/:userId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.admin.toString() !== req.userId) return res.status(403).json({ message: 'Not authorized' });

    const userId = req.params.userId;
    // Check if room is full
    if (room.isPrivate && room.members.length >= 50) {
      return res.status(400).json({ message: 'Cannot approve: Private room is full (max 50 members).' });
    }

    // Remove from pending
    room.pendingApprovals = room.pendingApprovals.filter(id => id.toString() !== userId);
    // Add to members
    if (!room.members.includes(userId)) {
      room.members.push(userId);
    }
    await room.save();
    res.json({ message: 'User approved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject user
router.post('/:id/reject/:userId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.admin.toString() !== req.userId) return res.status(403).json({ message: 'Not authorized' });

    const userId = req.params.userId;
    // Remove from pending
    room.pendingApprovals = room.pendingApprovals.filter(id => id.toString() !== userId);
    await room.save();
    res.json({ message: 'User rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
