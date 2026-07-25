import bcrypt from 'bcrypt';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import AppError from '../utils/AppError.js';

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

export const getPublicRooms = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const totalRooms = await Room.countDocuments({ isDM: { $ne: true } });

  const rooms = await Room.find({ isDM: { $ne: true } })
    .select('-password')
    .populate('admin', 'username')
    .populate('members', 'username') 
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    rooms,
    currentPage: page,
    totalPages: Math.ceil(totalRooms / limit),
    totalRooms
  };
};


export const createRoom = async (roomData, userId) => {
  const { name, isPrivate, members, description, tags, password, requiresApproval, logoUrl } = roomData;

  if (isPrivate && !password) {
    throw new AppError('Password is required for private rooms.', 400);
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
    throw new AppError('Room not found', 404);
  }

  if (!room.isPrivate) {
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }
    return { message: 'Joined successfully' };
  }

  if (room.members.length >= 50) {
    throw new AppError('Private room is full (max 50 members).', 400);
  }

  const isMatch = await bcrypt.compare(password, room.password);
  if (!isMatch) {
    throw new AppError('Incorrect password', 401);
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
    throw new AppError('Room not found', 404);
  }

  if (!room.requiresApproval) {
    throw new AppError('This room does not accept join requests.', 400);
  }

  if (room.isPrivate && room.members.length >= 50) {
    throw new AppError('Cannot request access: Private room is full (max 50 members).', 400);
  }

  if (room.members.includes(userId)) {
    throw new AppError('You are already a member.', 400);
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
    throw new AppError('Room not found', 404);
  }

  if (room.isPrivate && !room.members.includes(userId)) {
    throw new AppError('Access denied', 403);
  }

  const messages = await Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('sender', 'username avatar')
    .lean()
      return messages.reverse();

};

export const getPendingRequests = async (roomId, userId) => {
  const room = await Room.findById(roomId).populate('pendingApprovals', 'username avatar');
  if (!room) throw new AppError('Room not found', 404);
  if (room.admin.toString() !== userId) throw new AppError('Not authorized', 403);

  return room.pendingApprovals;
};

export const approveUser = async (roomId, adminId, userIdToApprove) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);
  if (room.admin.toString() !== adminId) throw new AppError('Not authorized', 403);

  if (room.isPrivate && room.members.length >= 50) {
    throw new AppError('Cannot approve: Private room is full (max 50 members).', 400);
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
  if (!room) throw new AppError('Room not found', 404);
  if (room.admin.toString() !== adminId) throw new AppError('Not authorized', 403);

  room.pendingApprovals = room.pendingApprovals.filter(id => id.toString() !== userIdToReject);
  await room.save();
  return { message: 'User rejected' };
};
