import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import chatRoutes from './routes/chat.js';
import { authenticateSocket } from './middleware/auth.js';
import Board from './models/Board.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/chat', chatRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️  Server will continue without MongoDB - some features may not work');
  });

// Socket.io connection handling
io.use(authenticateSocket);

const activeUsers = new Map();
const boardRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  // Store user info
  activeUsers.set(socket.id, {
    userId: socket.userId,
    username: socket.username
  });

  // Join board room
  socket.on('join-board', (boardId) => {
    console.log(`🚪 User ${socket.username} (${socket.id}) joining board: ${boardId}`);

    // Join the Socket.io room
    socket.join(boardId);
    console.log(`✅ Socket joined room ${boardId}`);

    // Track users in board
    if (!boardRooms.has(boardId)) {
      boardRooms.set(boardId, new Set());
      console.log(`📝 Created new board room: ${boardId}`);
    }
    boardRooms.get(boardId).add(socket.id);

    console.log(`📊 Board ${boardId} now has ${boardRooms.get(boardId).size} users`);
    console.log(`👥 Socket IDs in room:`, Array.from(boardRooms.get(boardId)));

    // Notify others in the room
    socket.to(boardId).emit('user-joined', {
      userId: socket.userId,
      username: socket.username
    });

    // Send current users in room
    const roomUsers = Array.from(boardRooms.get(boardId))
      .map(socketId => activeUsers.get(socketId))
      .filter(Boolean);

    socket.emit('room-users', roomUsers);
    console.log(`📤 Sent room users to ${socket.username}:`, roomUsers.map(u => u.username));

    // Verify the socket is actually in the room
    const socketRooms = Array.from(socket.rooms);
    console.log(`🔍 Socket ${socket.id} is in rooms:`, socketRooms);
  });

  // Leave board room
  socket.on('leave-board', (boardId) => {
    console.log(`🚪 User ${socket.username} leaving board: ${boardId}`);
    socket.leave(boardId);

    if (boardRooms.has(boardId)) {
      boardRooms.get(boardId).delete(socket.id);
      console.log(`📊 Board ${boardId} now has ${boardRooms.get(boardId).size} users after leave`);

      if (boardRooms.get(boardId).size === 0) {
        boardRooms.delete(boardId);
        console.log(`🗑️ Deleted empty board room: ${boardId}`);
      }
    }

    socket.to(boardId).emit('user-left', {
      userId: socket.userId,
      username: socket.username
    });
  });

  // Canvas drawing events
  socket.on('canvas-update', (data) => {
    console.log(`📡 Received canvas-update: ${data.type} from ${socket.username}`);

    // Check room size
    const roomSize = boardRooms.get(data.boardId)?.size || 0;
    console.log(`📊 Room ${data.boardId} has ${roomSize} users`);

    // Add the sender's info and relay to other users in the room
    const updateData = {
      ...data,
      userId: socket.userId,
      username: socket.username
    };

    socket.to(data.boardId).emit('canvas-update', updateData);
    console.log(`📤 Broadcasted to ${roomSize - 1} other users in room ${data.boardId}`);
  });

  // Sticky note events
  socket.on('sticky-note-add', (data) => {
    socket.to(data.boardId).emit('sticky-note-add', data);
  });

  socket.on('sticky-note-update', (data) => {
    socket.to(data.boardId).emit('sticky-note-update', data);
  });

  socket.on('sticky-note-delete', (data) => {
    socket.to(data.boardId).emit('sticky-note-delete', data);
  });

  // Chat events
  socket.on('chat-message', async (data) => {
    try {
      const messageId = new mongoose.Types.ObjectId().toString();
      const timestamp = new Date();

      // Add message to board's chatMessages array
      await Board.findByIdAndUpdate(
        data.boardId,
        {
          $push: {
            chatMessages: {
              $each: [{
                id: messageId,
                userId: socket.userId,
                username: socket.username,
                text: data.text,
                createdAt: timestamp
              }],
              $slice: -100 // Keep only the last 100 messages
            }
          }
        }
      );

      const messageData = {
        id: messageId,
        boardId: data.boardId,
        userId: socket.userId,
        username: socket.username,
        text: data.text,
        timestamp: timestamp
      };

      io.to(data.boardId).emit('chat-message', messageData);
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  });

  // Cursor tracking
  socket.on('cursor-move', (data) => {
    socket.to(data.boardId).emit('cursor-move', {
      ...data,
      userId: socket.userId,
      username: socket.username
    });
  });



  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);

    // Remove from all board rooms
    for (const [boardId, users] of boardRooms.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(boardId).emit('user-left', {
          userId: socket.userId,
          username: socket.username
        });

        if (users.size === 0) {
          boardRooms.delete(boardId);
        }
      }
    }

    activeUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 6000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Client should connect to: http://localhost:${PORT}`);
});