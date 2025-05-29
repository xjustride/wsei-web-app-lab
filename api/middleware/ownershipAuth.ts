import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import Story from '../models/Story';
import Task from '../models/Task';
import mongoose from 'mongoose';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware to check if user can view project (simplified role-based system)
export const canViewProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin, Developer, DevOps have full access to everything
    if (req.user.role === 'admin' || req.user.role === 'developer' || req.user.role === 'devops') {
      return next();
    }

    // Guests can only view projects they are explicitly assigned to
    if (req.user.role === 'guest') {
      const projectId = req.params.id || req.params.projectId || req.body.projectId;
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if guest is owner, member, or viewer
      const isOwner = project.ownerId.toString() === req.user!.id;
      const isMember = project.members.some(m => m.userId.toString() === req.user!.id);
      const isViewer = project.viewers.some(v => v.userId.toString() === req.user!.id);

      if (isOwner || isMember || isViewer) {
        return next();
      }

      return res.status(403).json({ 
        message: 'Brak uprawnień do przeglądania tego projektu.',
        userRole: req.user!.role
      });
    }

    // For any other roles, deny access
    return res.status(403).json({ 
      message: 'Nieznana rola użytkownika.',
      userRole: req.user!.role
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// Middleware to check if user can edit project (simplified role-based system)
export const canEditProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin, Developer, DevOps have full access to everything
    if (req.user.role === 'admin' || req.user.role === 'developer' || req.user.role === 'devops') {
      return next();
    }

    // Guests cannot edit anything
    if (req.user.role === 'guest') {
      return res.status(403).json({ 
        message: 'Goście mają dostęp tylko do odczytu.',
        userRole: req.user.role
      });
    }

    // For any other roles, deny access
    return res.status(403).json({ 
      message: 'Nieznana rola użytkownika.',
      userRole: req.user!.role
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// Middleware to check if user can edit story (simplified role-based system)
export const canEditStory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin, Developer, DevOps have full access to everything
    if (req.user.role === 'admin' || req.user.role === 'developer' || req.user.role === 'devops') {
      return next();
    }

    // Guests cannot edit anything
    if (req.user.role === 'guest') {
      return res.status(403).json({ 
        message: 'Goście mają dostęp tylko do odczytu.',
        userRole: req.user.role
      });
    }

    // For any other roles, deny access
    return res.status(403).json({ 
      message: 'Nieznana rola użytkownika.',
      userRole: req.user!.role
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// Middleware to check if user can edit task (restrictive model - only admins and assigned users)
export const canEditTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin always has access
    if (req.user.role === 'admin') {
      return next();
    }

    // Guests cannot edit anything
    if (req.user.role === 'guest') {
      return res.status(403).json({ 
        message: 'Goście mają dostęp tylko do odczytu.',
        userRole: req.user.role
      });
    }

    const taskId = req.params.taskId;
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Valid task ID is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.assignedUserId && task.assignedUserId.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Tylko administratorzy i użytkownicy przypisani do zadania mogą je edytować.',
      userRole: req.user.role
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const canDelete = (resourceType: 'project' | 'story' | 'task') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (req.user.role === 'admin') {
        return next();
      }

      if (req.user.role === 'guest') {
        return res.status(403).json({ 
          message: 'Goście mają dostęp tylko do odczytu.',
          userRole: req.user.role
        });
      }

      if (resourceType === 'task') {
        const taskId = req.params.taskId;
        if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
          return res.status(400).json({ message: 'Valid task ID is required' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
          return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is assigned to the task
        if (task.assignedUserId && task.assignedUserId.toString() === req.user.id) {
          return next();
        }

        return res.status(403).json({ 
          message: 'Tylko administratorzy i użytkownicy przypisani do zadania mogą je usuwać.',
          userRole: req.user.role
        });
      }

      if (req.user.role === 'developer' || req.user.role === 'devops') {
        return next();
      }

      return res.status(403).json({ 
        message: `Brak uprawnień do usuwania ${resourceType === 'project' ? 'projektów' : resourceType === 'story' ? 'historyjek' : 'zadań'}.`,
        userRole: req.user!.role
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  };
};