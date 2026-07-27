const mongoose = require('mongoose');

/**
 * Connect to MongoDB via Mongoose.
 * Mongoose maintains an internal connection pool (default 5 connections)
 * rather than opening a new connection per request — this avoids the
 * overhead of TCP handshake + auth on every database call.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
