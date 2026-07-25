import Message from '../models/Message.js';
import { sendFriendRequest } from '../services/userService.js';
import { createOrGetDM } from '../services/roomService.js';
import xss from 'xss'

const onlineUsers = new Map(); // socket.id -> userId
const waitingUsers = []; // users waiting for a random match
const activeChats = new Map();
const activeRooms = new Map();
const matchCooldowns = new Map(); // socket.id -> lastMatchRequestTime

const emitStrangerStats = (io) => {
  io.emit('stranger_stats', {
    onlineUsersCount: onlineUsers.size,
    waitingUsersCount: waitingUsers.length,
  });
};

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User authenticates/identifies themselves
    socket.on('register_user', (userId) => {
      onlineUsers.set(socket.id, userId);
      socket.emit('online_users_initial', Array.from(onlineUsers.values()));
      socket.broadcast.emit('user_joined', userId);
      emitStrangerStats(io);
    });

    // Room functionality
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('send_message', async (data) => {
      // data should contain roomId, sender(userId), content, and optional fileUrl
      try {
        // Validation: Must have either content or fileUrl
        if (!data.content?.trim() && !data.fileUrl) {
           return; 
        }

        // Skip database save for random stranger chats
        if (data.roomId && data.roomId.startsWith('match_')) {
          const strangerMessage = {
            _id: Math.random().toString(36).substr(2, 9), // Temp ID for React keys
            sender: { _id: data.senderId, username: 'Stranger' },
            room: data.roomId,
            content: data.content || '',
            fileUrl: data.fileUrl || undefined,
            createdAt: new Date()
          };
          io.to(data.roomId).emit('receive_message', strangerMessage);
          return;
        }

        const newMessage = new Message({
          sender: data.senderId,
          room: data.roomId,
          content: data.content ? xss(data.content) : '',
          fileUrl: data.fileUrl || undefined, // undefined prevents empty string issue in DB schema
          readBy: [data.senderId]
        });
        await newMessage.save();
        
        const populatedMessage = await newMessage.populate('sender', 'username avatar');
        io.to(data.roomId).emit('receive_message', populatedMessage);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error_message', { message: 'Failed to send message.' });
      }
    });

    // Random matching logic
    socket.on('find_stranger', () => {
      // Cooldown check (prevent spam)
      const lastRequest = matchCooldowns.get(socket.id);
      const now = Date.now();
      if (lastRequest && now - lastRequest < 3000) {
        return; // Ignore if less than 3 seconds since last request
      }
      matchCooldowns.set(socket.id, now);

      // Already waiting
      if (waitingUsers.includes(socket) || activeChats.has(socket.id)) {
        return;
      }

      // Nobody waiting
      if (waitingUsers.length === 0) {
        waitingUsers.push(socket);
        socket.emit('searching');
        emitStrangerStats(io);
        return;
      }

      // Get first waiting user
      const partner = waitingUsers.shift();

      // Safety check
      if (!partner || partner.id === socket.id) {
        return;
      }

      // Create temporary room
      const roomId = `match_${Date.now()}_${socket.id}`;

      // Join both users
      socket.join(roomId);
      partner.join(roomId);

      // Save partner information
      activeChats.set(socket.id, partner.id);
      activeChats.set(partner.id, socket.id);

      // Save room information
      activeRooms.set(socket.id, roomId);
      activeRooms.set(partner.id, roomId);

      // Notify both users
      io.to(roomId).emit('stranger_matched', { roomId });
      emitStrangerStats(io);
    });

    socket.on('random_message', (data) => {
      const roomId = activeRooms.get(socket.id);

      if (!roomId) {
        return;
      }

      io.to(roomId).emit('receive_random_message', {
        senderId: onlineUsers.get(socket.id) || socket.id,
        message: data.message,
        timestamp: new Date()
      });
    });

    socket.on('save_stranger', async () => {
      const partnerId = activeChats.get(socket.id);
      const roomId = activeRooms.get(socket.id);
      const currentUserId = onlineUsers.get(socket.id);
      
      if (!partnerId || !roomId || !currentUserId) return;
      
      const partnerUserId = onlineUsers.get(partnerId);
      if (!partnerUserId) return;

      try {
        const result = await sendFriendRequest(currentUserId, partnerUserId);
        
        // If the result status is 'friends', it means the other person had already saved/requested us!
        if (result.status === 'friends') {
          // Create DM room automatically
          const dmRoom = await createOrGetDM(currentUserId, partnerUserId);
          
          // Emit success to both
          const partnerSocket = io.sockets.sockets.get(partnerId);
          
          socket.emit('stranger_saved_success', { dmRoom });
          if (partnerSocket) {
            partnerSocket.emit('stranger_saved_success', { dmRoom });
          }
        } else {
          // It's just 'sent', meaning we are waiting for them to save too
          socket.emit('stranger_save_status', { status: 'sent' });
        }
      } catch (error) {
        console.error('Error saving stranger:', error);
      }
    });

    socket.on('leave_stranger', () => {
      const partnerId = activeChats.get(socket.id);
      const roomId = activeRooms.get(socket.id);

      if (!partnerId || !roomId) {
        return;
      }
      const partnerSocket = io.sockets.sockets.get(partnerId);

      socket.leave(roomId);
      if (partnerSocket) {
        partnerSocket.leave(roomId);
      }

      // Remove active chat
      activeChats.delete(socket.id);
      activeChats.delete(partnerId);

      // Remove active room
      activeRooms.delete(socket.id);
      activeRooms.delete(partnerId);

      if (partnerSocket) {
        partnerSocket.emit("stranger_disconnected");
      }

      socket.emit("ready_for_next");
      emitStrangerStats(io);
    });

    socket.on('leave_stranger_queue', () => {
      const index = waitingUsers.indexOf(socket);
      if(index !== -1) {
        waitingUsers.splice(index, 1);
        emitStrangerStats(io);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      const partnerId = activeChats.get(socket.id);
      const roomId = activeRooms.get(socket.id);

      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerId && roomId && partnerSocket) {
        partnerSocket.leave(roomId);

        // Notify partner
        partnerSocket.emit("stranger_disconnected");

        // Remove chat information
        activeChats.delete(socket.id);
        activeChats.delete(partnerId);

        activeRooms.delete(socket.id);
        activeRooms.delete(partnerId);
      }

      const userId = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);
      if (userId) {
        io.emit('user_left', userId);
      }

      // Remove from waiting queue if disconnected
      const index = waitingUsers.indexOf(socket);
      if(index !== -1) {
        waitingUsers.splice(index, 1);
      }
      
      matchCooldowns.delete(socket.id);
      emitStrangerStats(io);
    });
  });
};
