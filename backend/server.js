import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import adminRoutes from './routes/admin.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/connecthub')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io logic
const onlineUsers = new Map(); // socket.id -> userId
const waitingUsers = []; // users waiting for a random match

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User authenticates/identifies themselves
  socket.on('register_user', (userId) => {
    onlineUsers.set(socket.id, userId);
    io.emit('online_users_update', Array.from(onlineUsers.values()));
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
      const newMessage = new Message({
        sender: data.senderId,
        room: data.roomId,
        content: data.content,
        fileUrl: data.fileUrl || ''
      });
      await newMessage.save();
      
      const populatedMessage = await newMessage.populate('sender', 'username avatar');
      io.to(data.roomId).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Random matching logic
  socket.on('find_stranger', () => {
    if (waitingUsers.length > 0) {
      const match = waitingUsers.pop();
      const roomId = `match_${match.id}_${socket.id}`;
      
      socket.join(roomId);
      match.join(roomId);

      io.to(roomId).emit('stranger_matched', { roomId });
    } else {
      waitingUsers.push(socket);
    }
  });
  
  socket.on('leave_stranger_queue', () => {
    const index = waitingUsers.indexOf(socket);
    if(index !== -1) {
      waitingUsers.splice(index, 1);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    onlineUsers.delete(socket.id);
    io.emit('online_users_update', Array.from(onlineUsers.values()));
    
    // Remove from waiting queue if disconnected
    const index = waitingUsers.indexOf(socket);
    if(index !== -1) {
      waitingUsers.splice(index, 1);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
