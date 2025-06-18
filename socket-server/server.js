const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI environment variable is not set');
      console.log('📝 Please set up MongoDB Atlas or another cloud MongoDB service:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Create a free cluster');
      console.log('   3. Get your connection string');
      console.log('   4. Update MONGODB_URI in socket-server/.env');
      console.log('   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vahanseva');
      return false;
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('📝 Connection refused - this usually means:');
      console.log('   • MongoDB server is not running locally');
      console.log('   • You need to use a cloud MongoDB service like MongoDB Atlas');
      console.log('   • Update MONGODB_URI in socket-server/.env with your cloud connection string');
    }
    
    return false;
  }
};

// Initialize database connection
let dbConnected = false;
connectDB().then((connected) => {
  dbConnected = connected;
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes - only register if database is connected
app.use('/api/auth', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
}, authRoutes);

app.use('/api/rides', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
}, rideRoutes);

app.use('/api/users', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
}, userRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('rider-available', async (riderId) => {
    if (!dbConnected) {
      socket.emit('error', { message: 'Database not connected' });
      return;
    }
    
    try {
      const User = require('./models/User');
      await User.findByIdAndUpdate(riderId, { available: true });
      console.log(`Rider ${riderId} is now available`);
    } catch (error) {
      console.error('Error updating rider availability:', error);
      socket.emit('error', { message: 'Failed to update rider availability' });
    }
  });

  socket.on('rider-unavailable', async (riderId) => {
    if (!dbConnected) {
      socket.emit('error', { message: 'Database not connected' });
      return;
    }
    
    try {
      const User = require('./models/User');
      await User.findByIdAndUpdate(riderId, { available: false });
      console.log(`Rider ${riderId} is now unavailable`);
    } catch (error) {
      console.error('Error updating rider availability:', error);
      socket.emit('error', { message: 'Failed to update rider availability' });
    }
  });

  socket.on('accept-ride', async (data) => {
    if (!dbConnected) {
      socket.emit('error', { message: 'Database not connected' });
      return;
    }
    
    try {
      const Ride = require('./models/Ride');
      const ride = await Ride.findByIdAndUpdate(
        data.rideId,
        { status: 'assigned' },
        { new: true }
      ).populate('passengerId assignedRiderId');

      // Notify passenger about ride assignment
      io.to(ride.passengerId._id.toString()).emit('ride-assigned', {
        ride: ride,
        rider: ride.assignedRiderId
      });

      console.log(`Ride ${data.rideId} accepted by rider ${data.riderId}`);
    } catch (error) {
      console.error('Error accepting ride:', error);
      socket.emit('error', { message: 'Failed to accept ride' });
    }
  });

  socket.on('update-ride-status', async (data) => {
    if (!dbConnected) {
      socket.emit('error', { message: 'Database not connected' });
      return;
    }
    
    try {
      const Ride = require('./models/Ride');
      const ride = await Ride.findByIdAndUpdate(
        data.rideId,
        { status: data.status },
        { new: true }
      ).populate('passengerId assignedRiderId');

      // Notify passenger about status update
      io.to(ride.passengerId._id.toString()).emit('ride-status-updated', {
        rideId: data.rideId,
        status: data.status,
        ride: ride
      });

      console.log(`Ride ${data.rideId} status updated to ${data.status}`);
    } catch (error) {
      console.error('Error updating ride status:', error);
      socket.emit('error', { message: 'Failed to update ride status' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (!dbConnected) {
    console.log('⚠️  Server started but database is not connected');
    console.log('📝 Please configure MongoDB connection in socket-server/.env');
  }
});