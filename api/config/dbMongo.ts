import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-mongodb-atlas-uri' || 'mongodb://localhost:27017/managme';

export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default mongoose;