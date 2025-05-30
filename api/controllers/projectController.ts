import { Request, Response } from 'express';
import Project from '../models/Project';

export const getUserProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    let projects;
    if (userRole === 'admin' || userRole === 'guest') {
      projects = await Project.find({}).lean();
    } else {
      projects = await Project.find({
        $or: [ 
          { ownerId: userId }, 
          { 'members.userId': userId },
          { 'viewers.userId': userId }
        ]
      }).lean();
    }
    
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { nazwa, opis } = req.body;
    const ownerId = (req as any).user.id;
    
    const project = await Project.create({
      nazwa,
      opis,
      ownerId,
      members: [ { userId: ownerId } ]
    });
    
    res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    const project = await Project.findById(id).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (userRole === 'admin' || userRole === 'guest') {
      return res.json(project);
    }
    
    if (
      project.ownerId.toString() !== userId &&
      !project.members.some(m => m.userId.toString() === userId)
    ) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }
    
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nazwa, opis } = req.body;
    const userId = (req as any).user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (nazwa !== undefined) project.nazwa = nazwa;
    if (opis !== undefined) project.opis = opis;

    await project.save();

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: Only the project owner can delete the project' });
    }

    await project.deleteOne();

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const addViewer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: viewerUserId } = req.body;
    const currentUserId = (req as any).user.id;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.ownerId.toString() === currentUserId;
    const isMember = project.members.some(m => m.userId.toString() === currentUserId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Only project owners and members can manage viewers' });
    }

    const isAlreadyViewer = project.viewers.some(v => v.userId.toString() === viewerUserId);
    if (isAlreadyViewer) {
      return res.status(400).json({ message: 'User is already a viewer' });
    }

    project.viewers.push({ userId: viewerUserId, assignedAt: new Date() });
    await project.save();

    return res.json({ message: 'Viewer added successfully', project });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const removeViewer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: viewerUserId } = req.body;
    const currentUserId = (req as any).user.id;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.ownerId.toString() === currentUserId;
    const isMember = project.members.some(m => m.userId.toString() === currentUserId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Only project owners and members can manage viewers' });
    }

    project.viewers = project.viewers.filter(v => v.userId.toString() !== viewerUserId);
    await project.save();

    return res.json({ message: 'Viewer removed successfully', project });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: memberUserId } = req.body;
    const currentUserId = (req as any).user.id;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.ownerId.toString() === currentUserId;
    
    if (!isOwner) {
      return res.status(403).json({ message: 'Only project owners can manage members' });
    }

    const isAlreadyMember = project.members.some(m => m.userId.toString() === memberUserId);
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    if (project.ownerId.toString() === memberUserId) {
      return res.status(400).json({ message: 'Project owner cannot be added as a member' });
    }

    project.members.push({ userId: memberUserId, assignedAt: new Date() });
    await project.save();

    return res.json({ message: 'Member added successfully', project });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: memberUserId } = req.body;
    const currentUserId = (req as any).user.id;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.ownerId.toString() === currentUserId;
    
    if (!isOwner) {
      return res.status(403).json({ message: 'Only project owners can manage members' });
    }

    project.members = project.members.filter(m => m.userId.toString() !== memberUserId);
    await project.save();

    return res.json({ message: 'Member removed successfully', project });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
