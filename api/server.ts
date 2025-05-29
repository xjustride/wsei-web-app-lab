import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectToDatabase } from './config/dbMongo';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import userRoutes from './routes/users';
import storyRoutes from './routes/stories';
import taskRoutes from './routes/tasks'; // Add this line
import { seedDatabase } from './utils/dbSeeder';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Add a simple health check endpoint
app.get('/api/health-check', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'ManagME API service is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/tasks', taskRoutes); // Add this line

// Error handling middleware
interface ErrorWithMessage extends Error {
  message: string;
}

app.use((err: ErrorWithMessage, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start the server
app.listen(PORT, async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('🛢️ Connected to MongoDB database');
    
    // Seed the database with initial data
    await seedDatabase();
    
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
});