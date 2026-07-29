import User from '../models/User.js';
import Room from '../models/Room.js';
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