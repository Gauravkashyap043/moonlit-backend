import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '9000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/moonlit',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  platform: {
    domain: process.env.PLATFORM_DOMAIN || 'yourdomain.com',
    defaultCommissionRate: parseFloat(process.env.DEFAULT_COMMISSION_RATE || '5'),
    defaultPayoutDelayDays: parseInt(process.env.DEFAULT_PAYOUT_DELAY_DAYS || '1', 10),
  },
};

