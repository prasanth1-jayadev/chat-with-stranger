import User from '../models/User.js';
import Room from '../models/Room.js';

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
