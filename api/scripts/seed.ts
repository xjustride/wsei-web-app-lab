import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from '../utils/dbSeeder';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/managme';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const main = async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('🌱 Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

main();
