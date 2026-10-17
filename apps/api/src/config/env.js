import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/web_memory',
  jwtSecret: process.env.JWT_SECRET || 'web_memory_dev_jwt_secret_do_not_use_in_prod_123456789',
  jwtExpiresIn: '7d',
  dashboardOrigin: process.env.DASHBOARD_ORIGIN || 'http://localhost:5173',
  extensionId: process.env.EXTENSION_ID || '*',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  aiApiKey: process.env.AI_API_KEY || 'AIzaSyCTQOmfWxv9bgTfUG87Axioc-ydWcK_-fo',
};
