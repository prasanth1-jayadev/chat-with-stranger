import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import AppError from '../utils/AppError.js';

export const getAllUsers = async (page = 1, limit = 10, search = '', filter = 'all') => {
  const query={};

  if(search){
    query.$or =[
      {username: {$regex:search , $options:'i'}},
      {email:{$regex:search,$options:'i'}}
    ]
  }
  
   if(filter === 'banned'){
    query.isBanned =true;

   } else if (filter === 'admin') {
    query.isAdmin = true;
   }    

   const skip = (page - 1) * limit;

   const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

   const totalUsers = await User.countDocuments(query);
   return {
      users,
      currentPage:parseInt(page),
      totalPages:Math.ceil(totalUsers/limit),
      totalUsers
     }
         
    };




export const getAllRooms = async () => {
  const rooms = await Room.find({})
    .select('-password')
    .populate('admin', 'username')
    .sort({ createdAt: -1 });
  return rooms;
};




export const toggleBanUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isAdmin) {
    throw new AppError('Cannot ban an admin user', 403);
  }

  user.isBanned = !user.isBanned;
  await user.save();

  // If banned, emit event to terminate active sessions
  if (user.isBanned) {
    try {
      const { getIo } = await import('../socket/socketHandler.js');
      if (getIo()) {
        getIo().emit('user_globally_banned', { userId: user._id.toString() });
      }
    } catch (err) {
      console.error('Failed to emit user_globally_banned:', err);
    }
  }

  return user;
};

export const toggleAdminRole = async (userId, currentAdminId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user._id.toString() === currentAdminId?.toString()) {
    throw new AppError('You cannot alter your own admin role', 400);
  }

  user.isAdmin = !user.isAdmin;
  await user.save();

  return user;
};

export const deleteRoom = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }
  
  // Cascade delete all associated messages
  await Message.deleteMany({ room: roomId });
  
  await Room.findByIdAndDelete(roomId);

  // Broadcast deletion to all connected room members
  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      getIo().to(roomId).emit('room_deleted', { roomId });
    }
  } catch (err) {
    console.error('Failed to emit room_deleted:', err);
  }

  return { message: 'Room and messages successfully deleted' };
};