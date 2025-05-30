import express from 'express';
import userRouter from './routes/users';
import authRouter from './routes/auth'; // <--- to dodaj

const app = express();

app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/auth', authRouter); // <--- to też

export default app;
