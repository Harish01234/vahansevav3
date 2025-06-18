const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'rider'],
    required: true
  },
  location: {
    lat: {
      type: Number,
      default: 0
    },
    lng: {
      type: Number,
      default: 0
    }
  },
  available: {
    type: Boolean,
    default: function() {
      return this.role === 'rider' ? false : true;
    }
  },
  phone: {
    type: String,
    trim: true
  },
  vehicleInfo: {
    type: {
      type: String,
      enum: ['car', 'bike', 'auto'],
      default: 'car'
    },
    model: String,
    number: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);