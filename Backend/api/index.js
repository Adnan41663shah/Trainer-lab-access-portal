import app from '../src/app.js';
import { connectDB } from '../src/db/mongo.js';

// Initialize DB connection (cached across invocations)
connectDB().catch(err => console.error("Vercel DB Init Error:", err));

// Vercel Serverless Function Handler
export default function handler(req, res) {
  // Ensure app handles the request
  return app(req, res);
}
