import mongoose from 'mongoose';
import { config } from '../config/env.js';

export const connectDB = async () => {
  try {
    // Check if already connected or connecting
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const conn = await mongoose.connect(config.mongo.uri);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    // Do not exit process in Vercel environment, let the function fail or retry
    if (!process.env.VERCEL) {
        process.exit(1);
    } else {
        throw error;
    }
  }
};
