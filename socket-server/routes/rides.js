const express = require('express');
const Ride = require('../models/Ride');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

// Book a ride
router.post('/book', auth, async (req, res) => {
  try {
    const { pickup, drop } = req.body;
    const passengerId = req.user.userId;

    // Calculate distance and fare
    const distance = calculateDistance(
      pickup.lat, pickup.lng,
      drop.lat, drop.lng
    );
    const fare = Math.round(distance * 15); // ₹15 per km
    const estimatedTime = Math.round(distance * 3); // 3 minutes per km

    // Create ride
    const ride = new Ride({
      passengerId,
      pickup,
      drop,
      fare,
      distance: Math.round(distance * 100) / 100,
      estimatedTime
    });

    await ride.save();

    // Find nearest available rider
    const availableRiders = await User.find({
      role: 'rider',
      available: true
    });

    if (availableRiders.length === 0) {
      return res.status(400).json({ message: 'No riders available at the moment' });
    }

    // Find closest rider
    let nearestRider = null;
    let minDistance = Infinity;

    availableRiders.forEach(rider => {
      const riderDistance = calculateDistance(
        pickup.lat, pickup.lng,
        rider.location.lat, rider.location.lng
      );
      if (riderDistance < minDistance) {
        minDistance = riderDistance;
        nearestRider = rider;
      }
    });

    if (nearestRider) {
      // Assign ride to nearest rider
      ride.assignedRiderId = nearestRider._id;
      await ride.save();

      // Make rider unavailable
      nearestRider.available = false;
      await nearestRider.save();

      // Send real-time notification to rider
      const io = req.app.get('io');
      io.to(nearestRider._id.toString()).emit('new-ride-request', {
        ride: ride,
        passenger: await User.findById(passengerId).select('-password')
      });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate('passengerId', '-password')
      .populate('assignedRiderId', '-password');

    res.status(201).json({
      message: 'Ride booked successfully',
      ride: populatedRide
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's rides
router.get('/my-rides', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let rides;
    if (userRole === 'user') {
      rides = await Ride.find({ passengerId: userId })
        .populate('assignedRiderId', '-password')
        .sort({ createdAt: -1 });
    } else {
      rides = await Ride.find({ assignedRiderId: userId })
        .populate('passengerId', '-password')
        .sort({ createdAt: -1 });
    }

    res.json({ rides });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending rides for riders
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const rides = await Ride.find({
      assignedRiderId: req.user.userId,
      status: { $in: ['pending', 'assigned'] }
    }).populate('passengerId', '-password');

    res.json({ rides });
  } catch (error) {
    console.error('Error fetching pending rides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ride status
router.patch('/:rideId/status', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Update ride status
    ride.status = status;
    await ride.save();

    // If ride is completed, make rider available again
    if (status === 'completed') {
      await User.findByIdAndUpdate(ride.assignedRiderId, { available: true });
    }

    const populatedRide = await Ride.findById(rideId)
      .populate('passengerId', '-password')
      .populate('assignedRiderId', '-password');

    res.json({
      message: 'Ride status updated',
      ride: populatedRide
    });
  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;