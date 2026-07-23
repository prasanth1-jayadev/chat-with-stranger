import bcrypt from 'bcrypt';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

export const getDMs = async (userId) => {
  const dms = await Room.find({ isDM: true, members: userId })
    .populate('members', 'username avatar isOnline');

  const dmsWithCount = await Promise.all(dms.map(async (dm) => {
    const count = await Message.countDocuments({
      room: dm._id,
      readBy: { $ne: userId }
    });
    return { ...dm.toObject(), messageCount: count };
  }));

  return dmsWithCount;
};

export const createOrGetDM = async (currentUserId, targetUserId) => {
  const existingDM = await Room.findOne({
    isDM: true,
    members: { $all: [currentUserId, targetUserId] }
  }).populate('members', 'username avatar isOnline');

  if (existingDM) {
    return existingDM;
  }

  const newDM = new Room({
    name: 'DM',
    isPrivate: true,
    isDM: true,
    members: [currentUserId, targetUserId]
  });

  await newDM.save();
  const populatedDM = await Room.findById(newDM._id).populate('members', 'username avatar isOnline');
  return populatedDM;
};

export const markMessagesAsRead = async (roomId, userId) => {
  await Message.updateMany(
    { room: roomId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
  return { message: 'Messages marked as read' };
};

export const getPublicRooms = async () => {
  const rooms = await Room.find({ isDM: { $ne: true } })
    .select('-password')
    .populate('admin', 'username')
    .populate('members', 'username');
  return rooms;
};

export const createRoom = async (roomData, userId) => {
  const { name, isPrivate, members, description, tags, password, requiresApproval, logoUrl } = roomData;

  if (isPrivate && !password) {
    throw { status: 400, message: 'Password is required for private rooms.' };
  }

  let hashedPassword = undefined;
  if (isPrivate && password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  const newRoom = new Room({
    name,
    isPrivate: isPrivate || false,
    admin: userId,
    members: members ? [...members, userId] : [userId],
    description: description || '',
    tags: tags || [],
    password: hashedPassword,
    requiresApproval: isPrivate ? (requiresApproval || false) : false,
    logoUrl: logoUrl || ''
  });

  await newRoom.save();
  return newRoom;
};

export const joinPrivateRoom = async (roomId, userId, password) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw { status: 404, message: 'Room not found' };
  }

  if (!room.isPrivate) {
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }
    return { message: 'Joined successfully' };
  }

  if (room.members.length >= 50) {
    throw { status: 400, message: 'Private room is full (max 50 members).' };
  }

  const isMatch = await bcrypt.compare(password, room.password);
  if (!isMatch) {
    throw { status: 401, message: 'Incorrect password' };
  }

  if (!room.members.includes(userId) && !room.pendingApprovals.includes(userId)) {
    room.pendingApprovals.push(userId);
    await room.save();
  }
  return { status: 'pending', message: 'Request sent for approval. The admin will review it.' };
};

export const requestAccess = async (roomId, userId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw { status: 404, message: 'Room not found' };
  }

  if (!room.requiresApproval) {
    throw { status: 400, message: 'This room does not accept join requests.' };
  }

  if (room.isPrivate && room.members.length >= 50) {
    throw { status: 400, message: 'Cannot request access: Private room is full (max 50 members).' };
  }

  if (room.members.includes(userId)) {
    throw { status: 400, message: 'You are already a member.' };
  }

  if (!room.pendingApprovals.includes(userId)) {
    room.pendingApprovals.push(userId);
    await room.save();
  }

  return { message: 'Request sent to admin for approval', status: 'pending' };
};

export const getMessages = async (roomId, userId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw { status: 404, message: 'Room not found' };
  }

  if (room.isPrivate && !room.members.includes(userId)) {
    throw { status: 403, message: 'Access denied' };
  }

  const messages = await Message.find({ room: roomId })
    .populate('sender', 'username avatar')
    .sort({ createdAt: 1 });

  return messages;
};

export const getPendingRequests = async (roomId, userId) => {
  const room = await Room.findById(roomId).populate('pendingApprovals', 'username avatar');
  if (!room) throw { status: 404, message: 'Room not found' };
  if (room.admin.toString() !== userId) throw { status: 403, message: 'Not authorized' };

  return room.pendingApprovals;
};

export const approveUser = async (roomId, adminId, userIdToApprove) => {
  const room = await Room.findById(roomId);
  if (!room) throw { status: 404, message: 'Room not found' };
  if (room.admin.toString() !== adminId) throw { status: 403, message: 'Not authorized' };

  if (room.isPrivate && room.members.length >= 50) {
    throw { status: 400, message: 'Cannot approve: Private room is full (max 50 members).' };
  }

  room.pendingApprovals = room.pendingApprovals.filter(id => id.toString() !== userIdToApprove);
  if (!room.members.includes(userIdToApprove)) {
    room.members.push(userIdToApprove);
  }
  await room.save();
  return { message: 'User approved' };
};

export const rejectUser = async (roomId, adminId, userIdToReject) => {
  const room = await Room.findById(roomId);
  if (!room) throw { status: 404, message: 'Room not found' };
  if (room.admin.toString() !== adminId) throw { status: 403, message: 'Not authorized' };

  room.pendingApprovals = room.pendingApprovals.filter(id => id.toString() !== userIdToReject);
  await room.save();
  return { message: 'User rejected' };
};
