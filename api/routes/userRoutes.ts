import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'List of users' });
});

router.post('/', (req: Request, res: Response) => {
  const user = req.body;
  res.status(201).json({ message: 'User created', user });
});

export default router;