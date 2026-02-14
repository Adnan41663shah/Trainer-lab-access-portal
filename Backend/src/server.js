import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './db/mongo.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    app.listen(config.port, () => {
      console.log(`\n🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🌐 CORS enabled for: ${config.cors.origin}`);
      console.log(`\n✅ Server is ready to accept requests\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Check if running on Vercel
if (process.env.VERCEL) {
    // In Vercel, we export the app for serverless execution
    // Mongoose buffers commands, so we can fire connection without awaiting
    connectDB().catch(err => console.error("Vercel DB Connect Error", err));
    console.log("🚀 Server running in Vercel Mode");
} else {
    // Local development
    startServer();
}

export default app;
