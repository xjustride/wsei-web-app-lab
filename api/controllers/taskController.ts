import { Request, Response } from 'express';
import Task, { ITimeLog } from '../models/Task';
import Story from '../models/Story';
import Project from '../models/Project';
import mongoose from 'mongoose';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { name, description, status, priority, projectId, storyId, assignedUserId, estimatedTime } = req.body;
    const userId = (req as any).user?.id;

    if (!name || !projectId || !storyId) {
      return res.status(400).json({ message: 'Name, projectId, and storyId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'Invalid projectId or storyId' });
    }

    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const storyExists = await Story.findById(storyId);
    if (!storyExists) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (storyExists.projectId.toString() !== projectId) {
      return res.status(400).json({ message: 'Story does not belong to the specified project' });
    }

    const newTask = new Task({
      name,
      description,
      status,
      priority,
      projectId,
      storyId,
      assignedUserId,
      estimatedTime
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

export const getTasksByStory = async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'Invalid storyId' });
    }
    const tasks = await Task.find({ storyId });
    if (!tasks) {
      return res.status(404).json({ message: 'No tasks found for this story' });
    }
    res.status(200).json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid taskId' });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid taskId' });
    }

    const taskToUpdate = await Task.findById(taskId);
    if (!taskToUpdate) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (updates.assignedUserId && !updates.status && taskToUpdate.status === 'todo') {
      updates.status = 'in-progress';
      updates.startDate = new Date();
    } else if (updates.assignedUserId && updates.status === 'in-progress' && !taskToUpdate.startDate) {
      updates.startDate = new Date();
    }

    if (updates.status) {
      if (updates.status === 'in-progress') {
        if (!updates.assignedUserId && !taskToUpdate.assignedUserId) {
          return res.status(400).json({ message: 'Cannot move task to "in-progress" without an assigned user.' });
        }
        if (!updates.startDate && !taskToUpdate.startDate) {
          updates.startDate = new Date();
        }
      } else if (updates.status === 'done') {
        if (!updates.endDate && !taskToUpdate.endDate) {
          updates.endDate = new Date();
        }
        if (!taskToUpdate.assignedUserId && !updates.assignedUserId) {
          return res.status(400).json({ message: 'Task must be assigned to be marked as done.' });
        }
      }
    }

    delete updates.projectId;
    delete updates.storyId;

    const updatedTask = await Task.findByIdAndUpdate(taskId, { $set: updates }, { new: true });
    res.status(200).json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, assignedUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid taskId' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updatePayload: any = { status };
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (status === 'in-progress') {
      if (assignedUserId) {
        updatePayload.assignedUserId = assignedUserId;
        if (!task.startDate) {
          updatePayload.startDate = new Date();
        }
      } else if (!task.assignedUserId) {
        return res.status(400).json({ message: 'Cannot move task to "in-progress" without an assigned user.' });
      }
      if (!task.startDate && !updatePayload.startDate) {
        updatePayload.startDate = new Date();
      }
    } else if (status === 'done') {
      if (!task.endDate) {
        updatePayload.endDate = new Date();
      }
      if (!task.assignedUserId && !assignedUserId) {
        return res.status(400).json({ message: 'Task must be assigned to be marked as done.' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, { $set: updatePayload }, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found during update' });
    }

    res.status(200).json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid taskId' });
    }
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

export const addTimeLogToTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { date, hours, comment } = req.body;
    const userId = (req as any).user?.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid taskId' });
    }

    if (!date || hours === undefined) {
      return res.status(400).json({ message: 'Date and hours are required for time log' });
    }

    if (typeof hours !== 'number' || hours <= 0) {
      return res.status(400).json({ message: 'Hours must be a positive number' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const newTimeLog: ITimeLog = {
      date: new Date(date),
      hours,
      comment,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined
    } as ITimeLog;

    task.timeLogs = task.timeLogs ? [...task.timeLogs, newTimeLog] : [newTimeLog];
    task.loggedHours = task.timeLogs.reduce((sum, log) => sum + log.hours, 0);

    await task.save();
    res.status(200).json(task);
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding time log to task', error: error.message });
  }
};

export const getTasksByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid projectId' });
    }
    const tasks = await Task.find({ projectId });
    res.status(200).json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching tasks by project', error: error.message });
  }
};
