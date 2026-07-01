import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas (or any Mongo URI).
 * Exits the process on failure so we never run against a dead DB.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('✖ MONGO_URI is not set. Copy .env.example → .env and fill it in.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri);
    console.log(`✔ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`✖ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
