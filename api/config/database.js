const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info('MongoDB connected successfully', { 
      host: conn.connection.host,
      database: conn.connection.name,
      port: conn.connection.port
    });

    // Log connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { 
        error: err.message,
        stack: err.stack 
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB', { 
      error: error.message,
      stack: error.stack,
      uri: process.env.MONGODB_URI ? 'URI provided' : 'No URI provided'
    });
    process.exit(1);
  }
};

module.exports = connectDB;
