import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const getFriendsAndRequests = async (userId) => {
  const user = await User.findById(userId)
    .populate('friends', 'username avatar isOnline interests')
    .populate('friendRequests', 'username avatar isOnline interests')
    .populate('sentRequests', 'username avatar isOnline interests');
    
  return {
    friends: user.friends,
    friendRequests: user.friendRequests,
    sentRequests: user.sentRequests
  };
};

export const sendFriendRequest = async (currentUserId, targetUserId) => {
  if (targetUserId === currentUserId) {
    throw new AppError('You cannot send a friend request to yourself.', 400);
  }

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  if (currentUser.friends.includes(targetUserId)) {
    throw new AppError('You are already friends.', 400);
  }

  if (currentUser.sentRequests.includes(targetUserId)) {
    throw new AppError('Request already sent.', 400);
  }

  if (currentUser.friendRequests.includes(targetUserId)) {
    // They already sent us a request, let's just accept it automatically
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
    targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== currentUserId);
    
    currentUser.friends.push(targetUserId);
    targetUser.friends.push(currentUserId);
    
    await currentUser.save();
    await targetUser.save();
    return { message: 'Friend request accepted.', status: 'friends' };
  }

  // Normal flow: send request
  currentUser.sentRequests.push(targetUserId);
  targetUser.friendRequests.push(currentUserId);

  await currentUser.save();
  await targetUser.save();

  return { message: 'Friend request sent.', status: 'sent' };
};

export const acceptFriendRequest = async (currentUserId, targetUserId) => {
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser.friendRequests.includes(targetUserId)) {
    throw new AppError('No friend request found from this user.', 400);
  }

  currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
  targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== currentUserId);
  
  if (!currentUser.friends.includes(targetUserId)) currentUser.friends.push(targetUserId);
  if (!targetUser.friends.includes(currentUserId)) targetUser.friends.push(currentUserId);

  await currentUser.save();
  await targetUser.save();

  return { message: 'Friend request accepted.', status: 'friends' };
};

export const rejectFriendRequest = async (currentUserId, targetUserId) => {
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  // Can be used to reject incoming or cancel outgoing
  currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
  currentUser.sentRequests = currentUser.sentRequests.filter(id => id.toString() !== targetUserId);
  
  if (targetUser) {
    targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== currentUserId);
    targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== currentUserId);
    await targetUser.save();
  }

  await currentUser.save();
  return { message: 'Friend request removed.', status: 'none' };
};

export const removeFriend = async (currentUserId, targetUserId) => {
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  currentUser.friends = currentUser.friends.filter(id => id.toString() !== targetUserId);
  if (targetUser) {
    targetUser.friends = targetUser.friends.filter(id => id.toString() !== currentUserId);
    await targetUser.save();
  }

  await currentUser.save();
  return { message: 'Friend removed.', status: 'none' };
};
