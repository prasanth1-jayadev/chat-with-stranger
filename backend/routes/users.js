import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get user profile (for modal)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friends and requests
router.get('/me/friends', async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username avatar isOnline interests')
      .populate('friendRequests', 'username avatar isOnline interests')
      .populate('sentRequests', 'username avatar isOnline interests');
      
    res.json({
      friends: user.friends,
      friendRequests: user.friendRequests,
      sentRequests: user.sentRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a friend request
router.post('/:id/request', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.userId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ message: "You are already friends." });
    }

    if (currentUser.sentRequests.includes(targetUserId)) {
      return res.status(400).json({ message: "Request already sent." });
    }

    if (currentUser.friendRequests.includes(targetUserId)) {
      // They already sent us a request, let's just accept it automatically
      currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
      targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== req.userId);
      
      currentUser.friends.push(targetUserId);
      targetUser.friends.push(req.userId);
      
      await currentUser.save();
      await targetUser.save();
      return res.json({ message: "Friend request accepted.", status: "friends" });
    }

    // Normal flow: send request
    currentUser.sentRequests.push(targetUserId);
    targetUser.friendRequests.push(req.userId);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Friend request sent.", status: "sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a friend request
router.post('/:id/accept', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser.friendRequests.includes(targetUserId)) {
      return res.status(400).json({ message: "No friend request found from this user." });
    }

    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
    targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== req.userId);
    
    if (!currentUser.friends.includes(targetUserId)) currentUser.friends.push(targetUserId);
    if (!targetUser.friends.includes(req.userId)) targetUser.friends.push(req.userId);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Friend request accepted.", status: "friends" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject/Cancel a friend request
router.post('/:id/reject', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    // Can be used to reject incoming or cancel outgoing
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
    currentUser.sentRequests = currentUser.sentRequests.filter(id => id.toString() !== targetUserId);
    
    if (targetUser) {
      targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== req.userId);
      targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== req.userId);
      await targetUser.save();
    }

    await currentUser.save();
    res.json({ message: "Friend request removed.", status: "none" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a friend
router.post('/:id/remove', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    currentUser.friends = currentUser.friends.filter(id => id.toString() !== targetUserId);
    if (targetUser) {
      targetUser.friends = targetUser.friends.filter(id => id.toString() !== req.userId);
      await targetUser.save();
    }

    await currentUser.save();
    res.json({ message: "Friend removed.", status: "none" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
