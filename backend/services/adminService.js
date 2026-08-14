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




export const getAllRooms = async (search = '', filter = 'all') => {
  const query = {
    isDM: { $ne: true }, // Exclude 1-on-1 private DMs from room management
  };

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (filter === 'public') {
    query.isPrivate = false;
  } else if (filter === 'private') {
    query.isPrivate = true;
  } else if (filter === 'quarantined') {
    query.isQuarantined = true;
  }

  const rooms = await Room.find(query)
    .select('-password')
    .populate('admin', 'username email avatar')
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

export const toggleMuteUser = async (userId, durationHours = 24) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isAdmin) {
    throw new AppError('Cannot mute an admin user', 403);
  }

  user.isMuted = !user.isMuted;
  if (user.isMuted) {
    const muteExpiry = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    user.mutedUntil = muteExpiry;
    user.muteReason = `Muted by administrator for ${durationHours} hours`;
  } else {
    user.mutedUntil = null;
    user.muteReason = '';
  }
  await user.save();

  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      if (user.isMuted) {
        getIo().emit('user_muted', {
          userId: user._id.toString(),
          mutedUntil: user.mutedUntil,
          reason: user.muteReason,
        });
      } else {
        getIo().emit('user_unmuted', {
          userId: user._id.toString(),
        });
      }
    }
  } catch (err) {
    console.error('Failed to emit user mute socket event:', err);
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

export const toggleQuarantineRoom = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  room.isQuarantined = !room.isQuarantined;
  if (room.isQuarantined) {
    room.quarantineReason = 'Quarantined by administrator for moderation review';
    room.quarantinedAt = new Date();
  } else {
    room.quarantineReason = '';
    room.quarantinedAt = null;
  }
  await room.save();

  try {
    const { getIo } = await import('../socket/socketHandler.js');
    if (getIo()) {
      if (room.isQuarantined) {
        getIo().emit('room_quarantined', {
          roomId: room._id.toString(),
          reason: room.quarantineReason,
        });
      } else {
        getIo().emit('room_unquarantined', {
          roomId: room._id.toString(),
        });
      }
    }
  } catch (err) {
    console.error('Failed to emit room quarantine socket event:', err);
  }

  return room;
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

export const getAnalytics = async () => {
  const now = new Date();
  
  // Calculate start of 7 days ago (midnight)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 1. User Signups per day for last 7 days
  const userSignups = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 2. Messages sent per day for last 7 days
  const messageActivity = await Message.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 3. Hourly message distribution
  const hourlyActivity = await Message.aggregate([
    {
      $project: {
        hour: { $hour: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$hour',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Generate 7-day date series to ensure complete data (filling 0 for missing days)
  const daysList = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
    const shortDay = dayNames[d.getDay()];

    const userCount = userSignups.find((u) => u._id === dateStr)?.count || 0;
    const msgCount = messageActivity.find((m) => m._id === dateStr)?.count || 0;

    daysList.push({
      date: dateStr,
      day: shortDay,
      label: dayLabel,
      signups: userCount,
      messages: msgCount,
    });
  }

  // Format 24-hour distribution
  const hoursList = [];
  let peakHour = 0;
  let maxHourlyCount = 0;

  for (let h = 0; h < 24; h++) {
    const found = hourlyActivity.find((item) => item._id === h);
    const count = found ? found.count : 0;
    if (count > maxHourlyCount) {
      maxHourlyCount = count;
      peakHour = h;
    }

    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    hoursList.push({
      hour: h,
      label: `${displayHour} ${ampm}`,
      count,
    });
  }

  // Compute totals & peak hour label
  const totalSignupsLast7Days = daysList.reduce((acc, curr) => acc + curr.signups, 0);
  const totalMessagesLast7Days = daysList.reduce((acc, curr) => acc + curr.messages, 0);
  const peakAmPm = peakHour >= 12 ? 'PM' : 'AM';
  const peakDisplay = peakHour % 12 === 0 ? 12 : peakHour % 12;
  const peakNextDisplay = (peakHour + 1) % 12 === 0 ? 12 : (peakHour + 1) % 12;
  const peakNextAmPm = (peakHour + 1) >= 12 && (peakHour + 1) < 24 ? 'PM' : 'AM';
  const peakHourFormatted = `${peakDisplay}:00 ${peakAmPm} - ${peakNextDisplay}:00 ${peakNextAmPm}`;

  return {
    sevenDaysTrend: daysList,
    hourlyDistribution: hoursList,
    summary: {
      totalSignupsLast7Days,
      totalMessagesLast7Days,
      peakHour: peakHourFormatted,
      peakHourCount: maxHourlyCount,
    },
  };
};