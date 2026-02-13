import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Full name must be at least 3 characters'],
    maxlength: [60, 'Full name must not exceed 60 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false // Don't return password hash by default
  },
  
  role: {
    type: String,
    enum: ['trainer', 'admin'],
    default: 'trainer',
    required: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  refreshTokenHash: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Handle duplicate key errors
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});

export const User = mongoose.model('User', userSchema);
