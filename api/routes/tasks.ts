import express from 'express';
import {
  createTask,
  getTasksByStory,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addTimeLogToTask, // Import the new controller
  getTasksByProject // Added import for getTasksByProject
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth'; // Corrected import
import { requireAnyRole, blockGuestWrites } from '../middleware/roleAuth';
import { canEditTask, canDelete } from '../middleware/ownershipAuth';

const router = express.Router();

// Apply authentication and role middleware to all routes
router.use(authenticate);
router.use(requireAnyRole);

// Create a new task (associates with a project and story)
router.post('/', blockGuestWrites, createTask);

// Get all tasks for a specific story
router.get('/story/:storyId', getTasksByStory);

// Get all tasks for a specific project // Added route for tasks by project
router.get('/project/:projectId', getTasksByProject);

// Get a single task by its ID
router.get('/:taskId', getTaskById);

// Update a task
router.put('/:taskId', canEditTask, updateTask);

// Route to update task status
router.put('/:taskId/status', canEditTask, updateTaskStatus);

// Delete a task
router.delete('/:taskId', canDelete('task'), deleteTask);

// Add a time log entry to a task
router.post('/:taskId/timelog', canEditTask, addTimeLogToTask);

export default router;