import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vahanseva')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle ride request
  socket.on('request-ride', (data) => {
    // Emit to all available drivers
    io.emit('new-ride-request', {
      ...data,
      requestId: socket.id,
    });
  });

  // Handle ride acceptance
  socket.on('accept-ride', (data) => {
    // Notify the rider
    io.to(data.riderId).emit('ride-accepted', {
      driverId: socket.id,
      ...data,
    });
  });

  // Handle ride status updates
  socket.on('update-ride-status', (data) => {
    io.to(data.riderId).emit('ride-status-updated', {
      status: data.status,
      driverId: socket.id,
    });
  });

  // Handle driver location updates
  socket.on('update-driver-location', (data) => {
    io.to(data.riderId).emit('driver-location-updated', {
      location: data.location,
      driverId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 