import express from 'express';
import { 
  getAllStories, 
  getStoriesByProject,
  getStoryById,
  createStory,
  updateStory,
  deleteStory,
  updateStoryStatus // Import the new controller function
} from '../controllers/storyController';
import { authenticate } from '../middleware/auth';
import { requireAnyRole, blockGuestWrites } from '../middleware/roleAuth';
import { canEditStory, canDelete } from '../middleware/ownershipAuth';

const router = express.Router();

// Apply authentication middleware to all story routes
router.use(authenticate);
router.use(requireAnyRole); // Allow all authenticated users

// Get all stories
router.get('/', getAllStories);

// Get stories by project ID
router.get('/project/:projectId', getStoriesByProject);

// Get story by ID
router.get('/:id', getStoryById);

// Create a new story
router.post('/', blockGuestWrites, createStory);

// Update a story
router.put('/:id', canEditStory, updateStory);

// Update a story's status
router.put('/:id/status', canEditStory, updateStoryStatus);

// Delete a story
router.delete('/:id', canDelete('story'), deleteStory);

export default router;