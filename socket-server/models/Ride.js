const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickup: {
    address: {
      type: String,
      required: true
    },
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  drop: {
    address: {
      type: String,
      required: true
    },
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  assignedRiderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'en_route', 'completed', 'cancelled'],
    default: 'pending'
  },
  fare: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number,
    default: 0
  },
  estimatedTime: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ride', rideSchema);