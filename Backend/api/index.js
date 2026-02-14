import app from '../src/app.js';
import { connectDB } from '../src/db/mongo.js';

// Initialize DB connection (cached across invocations)
// Vercel Serverless Function Handler
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("Vercel DB Init Error:", err);
  }
  
  // Ensure app handles the request
  return app(req, res);
}
