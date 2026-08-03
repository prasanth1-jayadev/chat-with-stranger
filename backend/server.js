import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import { connectDB } from './config/db.js';
import { setupSocket } from './socket/socketHandler.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();
if(!process.env.JWT_SECRET){
  console.log("FATAL ERROR: JWT_SECRET environment variable is not defined.")
  process.exit(1);
}

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
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use(errorHandler);

// Socket.io logic
setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
