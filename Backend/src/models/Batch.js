import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true,
    minlength: [3, 'Batch name must be at least 3 characters'],
    maxlength: [80, 'Batch name must not exceed 80 characters']
  },
  
  trainerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'At least one trainer is required']
  }],
  
  startAt: {
    type: Date,
    required: [true, 'Start time is required']
  },
  
  endAt: {
    type: Date,
    required: [true, 'End time is required']
  },
  
  isCancelled: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Lab credentials (only accessible when batch is LIVE)
  labCredentials: {
    loginUrl: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      trim: true
    },
    password: {
      type: String
    }
  }
}, {
  timestamps: true
});

// Indexes for performance and queries
batchSchema.index({ trainerIds: 1, startAt: 1 });
batchSchema.index({ startAt: 1, endAt: 1 });
batchSchema.index({ isCancelled: 1 });

// Virtual for computed status (not stored in DB)
batchSchema.virtual('status').get(function() {
  if (this.isCancelled) return 'Cancelled';
  
  const now = new Date();
  if (now < this.startAt) return 'Upcoming';
  if (now >= this.startAt && now <= this.endAt) return 'Live';
  if (now > this.endAt) return 'Expired';
  
  return 'Unknown';
});

// Ensure virtuals are included in JSON
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

export const Batch = mongoose.model('Batch', batchSchema);
