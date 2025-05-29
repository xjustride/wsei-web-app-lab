import express from 'express';
import userRouter from './routes/userRoutes';

const app = express();

app.use(express.json()); // Obsługa JSON

app.use('/api/users', userRouter); // Przykładowa trasa

export default app;