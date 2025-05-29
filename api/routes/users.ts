import express from 'express';
import { getAllUsers, getUserById, getUsersByRole, createUser, updateUserRole, deleteUser } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Get users by role
router.get('/role/:role', getUsersByRole);

// Admin-only routes
router.post('/', requireAdmin, createUser);
router.put('/:id/role', requireAdmin, updateUserRole);
router.delete('/:id', requireAdmin, deleteUser);

export default router;