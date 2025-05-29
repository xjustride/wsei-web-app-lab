import express from 'express';
import { getUserProjects, createProject, getProjectById, deleteProject, updateProject, addViewer, removeViewer, addMember, removeMember } from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole, blockGuestWrites } from '../middleware/roleAuth';
import { canEditProject, canDelete, canViewProject } from '../middleware/ownershipAuth';

const router = express.Router();

// Apply authentication middleware to all project routes
router.use(authenticate);
router.use(requireAnyRole); // Allow all authenticated users

// Routes
router.get('/', getUserProjects); // Read access for all
router.post('/', blockGuestWrites, createProject); // Block guests from creating
router.get('/:id', canViewProject, getProjectById); // Only owners/members/viewers can view
router.put('/:id', canEditProject, updateProject); // Only owners/members can edit
router.delete('/:id', canDelete('project'), deleteProject); // Only owners can delete

// Viewer management routes
router.post('/:id/viewers', canEditProject, addViewer); // Add viewer to project
router.delete('/:id/viewers', canEditProject, removeViewer); // Remove viewer from project

// Member management routes
router.post('/:id/members', canEditProject, addMember); // Add member to project
router.delete('/:id/members', canEditProject, removeMember); // Remove member from project

export default router;