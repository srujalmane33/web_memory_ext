import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(customUri = null) {
  const uri = customUri || config.mongodbUri;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
