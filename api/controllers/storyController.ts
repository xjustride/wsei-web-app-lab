import { Request, Response } from 'express';
import Story from '../models/Story';
import Project from '../models/Project';
import Task from '../models/Task';

export const getAllStories = async (req: Request, res: Response) => {
  try {
    const stories = await Story.find().lean();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getStoriesByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    if (userRole === 'admin' || userRole === 'guest') {
      const stories = await Story.find({ projectId }).lean();
      return res.json(stories);
    }
    
    const project = await Project.findById(projectId).lean();
    if (!project || (
      project.ownerId.toString() !== userId &&
      !project.members.some(m => m.userId.toString() === userId)
    )) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }
    
    const stories = await Story.find({ projectId }).lean();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getStoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    const story = await Story.findById(id).lean();
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    if (userRole === 'admin' || userRole === 'guest') {
      return res.json(story);
    }
    
    const project = await Project.findById(story.projectId).lean();
    if (!project || (
      project.ownerId.toString() !== userId &&
      !project.members.some(m => m.userId.toString() === userId)
    )) {
      return res.status(403).json({ message: 'Access denied to this story' });
    }
    
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const createStory = async (req: Request, res: Response) => {
  try {
    const { name, description, status, priority, projectId } = req.body;
    const ownerId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    if (!name || !projectId) {
      return res.status(400).json({ message: 'Name and projectId are required' });
    }
    
    if (userRole !== 'admin') {
      const project = await Project.findById(projectId).lean();
      if (!project || (
        project.ownerId.toString() !== ownerId &&
        !project.members.some(m => m.userId.toString() === ownerId)
      )) {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    }
    
    const story = await Story.create({
      projectId,
      name,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      ownerId
    });
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority } = req.body;
    const userId = (req as any).user.id;
    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    const project = await Project.findById(story.projectId).lean();
    if (!project || (
      project.ownerId.toString() !== userId &&
      !project.members.some(m => m.userId.toString() === userId)
    )) {
      return res.status(403).json({ message: 'Access denied' });
    }
    story.name = name || story.name;
    story.description = description ?? story.description;
    story.status = status || story.status;
    story.priority = priority || story.priority;
    await story.save();
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateStoryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const project = await Project.findById(story.projectId).lean();
    if (!project || (
      project.ownerId.toString() !== userId &&
      !project.members.some(m => m.userId.toString() === userId)
    )) {
      return res.status(403).json({ message: 'Access denied to this story\'s project' });
    }

    story.status = status;
    await story.save();
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const deleteStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    let hasPermission = false;
    if (story.ownerId.toString() === userId) {
      hasPermission = true;
    } else {
      const project = await Project.findById(story.projectId).lean();
      if (project) {
        if (
          project.ownerId.toString() === userId ||
          project.members.some(member => member.userId.toString() === userId)
        ) {
          hasPermission = true;
        }
      } else {
        console.error(`Data integrity issue: Story ${id} references non-existent project ${story.projectId}`);
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied to delete this story' });
    }

    await Task.deleteMany({ storyId: id });
    await story.deleteOne();

    res.json({ message: 'Story and associated tasks deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};
