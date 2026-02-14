import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/cloudblitz-trainer-portal'
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '3d',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  
  adminInviteCode: process.env.ADMIN_INVITE_CODE,
  
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ADMIN_INVITE_CODE'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    // In Vercel/Production, missing env vars should throw to be visible in logs
    // process.exit(1) can sometimes be swallowed
    console.error(`❌ Missing required environment variable: ${envVar}`);
    if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
});
