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
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://trainer-lab-access-portal.vercel.app',
        'https://trainer-lab-access-portal-client-7vrw8j0xw.vercel.app',
        ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim()) : [])
      ];
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
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
     console.warn(`⚠️ Warning: Missing environment variable: ${envVar}`);
  }
});
