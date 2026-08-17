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
    
    const lastMessage = await Message.findOne({ room: dm._id })
      .sort({ createdAt: -1 })
      .select('content fileUrl createdAt sender')
      .lean();
      
    return { ...dm.toObject(), messageCount: count, lastMessage };
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

  const totalRooms = await Room.countDocuments({ isDM: { $ne: true }, isQuarantined: { $ne: true } });

  const rooms = await Room.find({ isDM: { $ne: true }, isQuarantined: { $ne: true } })
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
  const { name, isPrivate, members, description, tags, password, requiresApproval, logoUrl, maxCapacity } = roomData;

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
    logoUrl: logoUrl || '',
    maxCapacity: maxCapacity ? Number(maxCapacity) : 50
  });

  await newRoom.save();
  return newRoom;
};

export const joinPrivateRoom = async (roomId, userId, password) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.isQuarantined && room.admin?.toString() !== userId.toString()) {
    throw new AppError('This room is temporarily under moderation review due to community reports.', 403);
  }

  if (room.bannedUsers && room.bannedUsers.some(id => id.toString() === userId.toString())) {
    throw new AppError('You have been banned from this room.', 403);
  }

  const capacity = room.maxCapacity || 50;

  if (!room.isPrivate) {
    if (!room.members.includes(userId)) {
      if (room.members.length >= capacity) {
        throw new AppError(`Room is full (max ${capacity} members).`, 400);
      }
      room.members.push(userId);
      await room.save();
    }
    return { message: 'Joined successfully' };
  }

  if (room.members.length >= capacity) {
    throw new AppError(`Private room is full (max ${capacity} members).`, 400);
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

  if (room.bannedUsers && room.bannedUsers.some(id => id.toString() === userId.toString())) {
    throw new AppError('You have been banned from this room.', 403);
  }

  if (!room.requiresApproval) {
    throw new AppError('This room does not accept join requests.', 400);
  }

  const capacity = room.maxCapacity || 50;
  if (room.members.length >= capacity) {
    throw new AppError(`Cannot request access: Room is full (max ${capacity} members).`, 400);
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

  if (room.bannedUsers && room.bannedUsers.some(id => id.toString() === userId.toString())) {
    throw new AppError('You have been banned from this room.', 403);
  }

  if (room.isPrivate && !room.members.includes(userId)) {
    throw new AppError('Access denied', 403);
  }

  const messages = await Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('sender', 'username avatar')
    .lean();
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

  const capacity = room.maxCapacity || 50;
  if (room.members.length >= capacity) {
    throw new AppError(`Cannot approve: Room is full (max ${capacity} members).`, 400);
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

export const getRoomById = async (roomId, userId) => {
  const room = await Room.findById(roomId)
    .select('-password')
    .populate('admin', 'username avatar isOnline')
    .populate('members', 'username avatar isOnline')
    .populate('bannedUsers', 'username avatar isOnline');

  if (!room) throw new AppError('Room not found', 404);

  const uId = userId?.toString();
  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const isMember = (room.members || []).some(m => (m?._id ? m._id.toString() : m.toString()) === uId);
  const isAdminUser = Boolean(roomAdminId && roomAdminId === uId);

  if (room.isPrivate && !isMember && !isAdminUser) {
    throw new AppError('Access denied to private room.', 403);
  }

  return room;
};

export const getRoomMembers = async (roomId, userId) => {
  const room = await Room.findById(roomId)
    .populate('members', 'username avatar isOnline')
    .populate('bannedUsers', 'username avatar isOnline')
    .populate('admin', 'username avatar isOnline');

  if (!room) throw new AppError('Room not found', 404);

  const uId = userId?.toString();
  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const isMember = (room.members || []).some(m => (m?._id ? m._id.toString() : m.toString()) === uId);
  const isAdminUser = Boolean(roomAdminId && roomAdminId === uId);

  if (!isMember && !isAdminUser) {
    throw new AppError('Not authorized to view members.', 403);
  }

  return {
    admin: room.admin,
    members: room.members || [],
    bannedUsers: room.bannedUsers || [],
    maxCapacity: room.maxCapacity || 50,
    isPrivate: room.isPrivate,
    requiresApproval: room.requiresApproval,
    pinnedAnnouncement: room.pinnedAnnouncement || { text: '' }
  };
};

export const removeUserFromRoom = async (roomId, adminId, userIdToRemove) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const currentAdminId = adminId?.toString();

  if (!roomAdminId || roomAdminId !== currentAdminId) {
    throw new AppError('Not authorized. Only the admin can remove users.', 403);
  }
  if (currentAdminId === userIdToRemove?.toString()) {
    throw new AppError('Cannot remove yourself as admin.', 400);
  }
  
  const targetId = userIdToRemove?.toString();
  if (!room.members.some(m => (m?._id ? m._id.toString() : m.toString()) === targetId)) {
    throw new AppError('User is not a member of this room.', 400);
  }

  room.members = room.members.filter(id => (id?._id ? id._id.toString() : id.toString()) !== targetId);
  await room.save();

  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('user_removed', { userId: userIdToRemove, roomId });
    }
  } catch (err) {
    console.error('Failed to emit user_removed event:', err);
  }

  return { message: 'User removed from room successfully.' };
};

export const banUserFromRoom = async (roomId, adminId, userIdToBan) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const currentAdminId = adminId?.toString();

  if (!roomAdminId || roomAdminId !== currentAdminId) {
    throw new AppError('Not authorized. Only the admin can ban users.', 403);
  }
  if (currentAdminId === userIdToBan?.toString()) {
    throw new AppError('Cannot ban yourself as admin.', 400);
  }

  const targetId = userIdToBan?.toString();
  // Remove from members & pendingApprovals
  room.members = room.members.filter(id => (id?._id ? id._id.toString() : id.toString()) !== targetId);
  room.pendingApprovals = (room.pendingApprovals || []).filter(id => (id?._id ? id._id.toString() : id.toString()) !== targetId);

  // Add to bannedUsers if not already banned
  if (!room.bannedUsers) room.bannedUsers = [];
  if (!room.bannedUsers.some(id => (id?._id ? id._id.toString() : id.toString()) === targetId)) {
    room.bannedUsers.push(userIdToBan);
  }

  await room.save();

  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('user_banned', { userId: userIdToBan, roomId });
      getIo().to(roomId).emit('user_removed', { userId: userIdToBan, roomId });
    }
  } catch (err) {
    console.error('Failed to emit user_banned event:', err);
  }

  return { message: 'User has been banned from the room.' };
};

export const unbanUserFromRoom = async (roomId, adminId, userIdToUnban) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const currentAdminId = adminId?.toString();

  if (!roomAdminId || roomAdminId !== currentAdminId) {
    throw new AppError('Not authorized. Only the admin can unban users.', 403);
  }

  const targetId = userIdToUnban?.toString();
  if (room.bannedUsers) {
    room.bannedUsers = room.bannedUsers.filter(id => (id?._id ? id._id.toString() : id.toString()) !== targetId);
    await room.save();
  }

  return { message: 'User unbanned successfully.' };
};

export const deleteRoom = async (roomId, adminId) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const currentAdminId = adminId?.toString();

  if (!roomAdminId || roomAdminId !== currentAdminId) {
    throw new AppError('Not authorized. Only the admin can delete this room.', 403);
  }

  // Delete messages
  await Message.deleteMany({ room: roomId });

  // Delete room
  await Room.findByIdAndDelete(roomId);

  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('room_deleted', { roomId });
    }
  } catch (err) {
    console.error('Failed to emit room_deleted event:', err);
  }

  return { message: 'Room and its messages deleted successfully.' };
};

export const leaveRoom = async (roomId, userId) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const currentUserId = userId?.toString();

  if (roomAdminId && roomAdminId === currentUserId) {
    throw new AppError('Admins cannot leave their own room. You must delete the room instead.', 400);
  }

  const isMember = (room.members || []).some(m => (m?._id ? m._id.toString() : m.toString()) === currentUserId);
  if (!isMember) {
    throw new AppError('You are not a member of this room.', 400);
  }

  room.members = room.members.filter(id => (id?._id ? id._id.toString() : id.toString()) !== currentUserId);
  await room.save();

  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('user_left_room', { userId, roomId });
    }
  } catch (err) {
    console.error('Failed to emit user_left_room event:', err);
  }

  return { message: 'Left room successfully.' };
};

export const updateRoom = async (roomId, adminId, updateData) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const roomAdminId = room.admin?._id ? room.admin._id.toString() : room.admin?.toString();
  const currentAdminId = adminId?.toString();

  if (!roomAdminId || roomAdminId !== currentAdminId) {
    throw new AppError('Not authorized. Only the admin can edit this room.', 403);
  }

  const { name, description, tags, logoUrl, isPrivate, password, requiresApproval, maxCapacity } = updateData;

  if (name !== undefined && name !== null) room.name = String(name).trim();
  if (description !== undefined && description !== null) room.description = String(description).trim();
  if (tags !== undefined) room.tags = tags;
  if (logoUrl !== undefined) room.logoUrl = logoUrl;
  if (maxCapacity !== undefined) room.maxCapacity = Math.max(2, Math.min(500, Number(maxCapacity) || 50));

  if (isPrivate !== undefined) {
    const previousPrivacy = Boolean(room.isPrivate);
    room.isPrivate = Boolean(isPrivate);

    if (room.isPrivate) {
      if (password && String(password).trim()) {
        const salt = await bcrypt.genSalt(10);
        room.password = await bcrypt.hash(String(password).trim(), salt);
      } else if (!previousPrivacy && !room.password) {
        throw new AppError('A password is required when making a room private.', 400);
      }
      if (requiresApproval !== undefined) {
        room.requiresApproval = Boolean(requiresApproval);
      }
    } else {
      // Switching to public: clear password and approval requirement
      room.password = undefined;
      room.requiresApproval = false;
    }
  } else if (room.isPrivate) {
    // Already private, updating password or requiresApproval
    if (password && String(password).trim()) {
      const salt = await bcrypt.genSalt(10);
      room.password = await bcrypt.hash(String(password).trim(), salt);
    }
    if (requiresApproval !== undefined) {
      room.requiresApproval = Boolean(requiresApproval);
    }
  }

  await room.save();

  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('room_updated', {
        roomId,
        name: room.name,
        description: room.description,
        tags: room.tags,
        logoUrl: room.logoUrl,
        isPrivate: room.isPrivate,
        requiresApproval: room.requiresApproval,
        maxCapacity: room.maxCapacity
      });
    }
  } catch (err) {
    console.error('Failed to emit room_updated event:', err);
  }

  return room;
};




export const deleteMessage = async (roomId, messageId, userId) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404);

  const roomAdminId = (room.admin?._id || room.admin)?.toString();
  const currentUserId = userId?.toString();
  const senderId = (message.sender?._id || message.sender)?.toString();

  // Allow deletion if the user is the Room Admin OR the sender of the message
  const isAuthorized = (roomAdminId && roomAdminId === currentUserId) || (senderId === currentUserId);
  if (!isAuthorized) {
    throw new AppError('Not authorized to delete this message', 403);
  }

  await Message.findByIdAndDelete(messageId);

  // Broadcast real-time event to everyone in the room
  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('message_deleted', { messageId, roomId });
    }
  } catch (err) {
    console.error('Failed to emit message_deleted:', err);
  }

  return { message: 'Message deleted successfully', messageId };
};




export const updatePinnedAnnouncement = async (roomId, adminId, text) => {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);

  const roomAdminId = (room.admin?._id || room.admin)?.toString();
  if (!roomAdminId || roomAdminId !== adminId?.toString()) {
    throw new AppError('Only the room admin can update the pinned announcement', 403);
  }

  room.pinnedAnnouncement = {
    text: (text || '').trim(),
    updatedAt: new Date()
  };

  await room.save();

  // Broadcast to all members in real-time
  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('room_pinned_updated', {
        roomId,
        pinnedAnnouncement: room.pinnedAnnouncement
      });
    }
  } catch (err) {
    console.error('Failed to emit room_pinned_updated:', err);
  }

  return room.pinnedAnnouncement;
};
