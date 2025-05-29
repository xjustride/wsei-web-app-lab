import { Request, Response } from 'express';
import User from '../models/User';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select('firstName lastName email role avatar createdAt')
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('firstName lastName email role avatar createdAt')
      .lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role })
      .select('firstName lastName email role avatar createdAt')
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, role, password } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik z tym adresem email już istnieje' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      role,
      passwordHash: password || 'defaultPassword123',
      authProvider: 'local'
    });

    await newUser.save();

    const userResponse = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      authProvider: newUser.authProvider,
      createdAt: newUser.createdAt
    };

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera', error: (error as Error).message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Rola jest wymagana' });
    }

    const validRoles = ['admin', 'developer', 'devops', 'guest'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Nieprawidłowa rola' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('firstName lastName email role avatar createdAt');

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera', error: (error as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user.id;

    if (id === currentUserId) {
      return res.status(400).json({ message: 'Nie możesz usunąć swojego własnego konta' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    res.json({ message: 'Użytkownik został usunięty' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera', error: (error as Error).message });
  }
};
