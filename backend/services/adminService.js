import User from '../models/User.js';
import Room from '../models/Room.js';
import AppError from '../utils/AppError.js';

export const getAllUsers = async () => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  return users;
};

export const getAllRooms = async () => {
  const rooms = await Room.find({})
    .select('-password')
    .populate('admin', 'username')
    .sort({ createdAt: -1 });
  return rooms;
};




export const toggleBanUser = async(userId)=>{
  const user = await User.findById(userId);
  if(!user){
    throw new AppError('user not found',404);

  }

  if(user.isAdmin){
    throw new AppError('cannot ban an admin user',403);

  }
  user.isBanned = !user.isBanned;
    await user.save();

    return user;
}

export const deleteRoom = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }
  
  // Note: For a robust app, we should also delete all messages for this room
  // await Message.deleteMany({ room: roomId });
  
  await Room.findByIdAndDelete(roomId);
  return { message: 'Room successfully deleted' };
};