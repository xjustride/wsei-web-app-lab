const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const logger = require('../utils/logger');

// GET /api/projects - Pobierz wszystkie projekty
router.get('/', async (req, res) => {
  try {
    logger.debug('Fetching all projects', { userId: req.user?.id });
    
    const projects = await Project.find()
      .populate('owner', 'firstName lastName username')
      .populate('teamMembers', 'firstName lastName username')
      .sort({ createdAt: -1 });
    
    logger.logDatabase('find', 'projects', true, { 
      count: projects.length,
      userId: req.user?.id 
    });
    
    res.json(projects);
  } catch (error) {
    logger.logDatabase('find', 'projects', false, { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas pobierania projektów', error: error.message });
  }
});

// GET /api/projects/:id - Pobierz konkretny projekt
router.get('/:id', async (req, res) => {
  try {
    logger.debug('Fetching project by ID', { 
      projectId: req.params.id,
      userId: req.user?.id 
    });
    
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName username')
      .populate('teamMembers', 'firstName lastName username');
    
    if (!project) {
      logger.warn('Project not found', { 
        projectId: req.params.id,
        userId: req.user?.id 
      });
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }
    
    logger.logDatabase('findById', 'projects', true, { 
      projectId: req.params.id,
      userId: req.user?.id 
    });
    
    res.json(project);
  } catch (error) {
    logger.logDatabase('findById', 'projects', false, { 
      error: error.message,
      projectId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas pobierania projektu', error: error.message });
  }
});

// POST /api/projects - Utwórz nowy projekt
router.post('/', async (req, res) => {
  try {
    const { name, description, status, priority, startDate, endDate, teamMembers } = req.body;
    
    logger.debug('Creating new project', { 
      name,
      status: status || 'active',
      priority: priority || 'medium',
      userId: req.user?.id 
    });
    
    const project = new Project({
      name,
      description,
      status: status || 'active',
      priority: priority || 'medium',
      startDate: startDate || new Date(),
      endDate,
      owner: req.user.id, // z middleware authenticateToken
      teamMembers: teamMembers || []
    });
    
    const savedProject = await project.save();
    const populatedProject = await Project.findById(savedProject._id)
      .populate('owner', 'firstName lastName username')
      .populate('teamMembers', 'firstName lastName username');
    
    logger.logDatabase('create', 'projects', true, { 
      projectId: savedProject._id.toString(),
      name: savedProject.name,
      userId: req.user?.id 
    });
    
    res.status(201).json(populatedProject);
  } catch (error) {
    logger.logDatabase('create', 'projects', false, { 
      error: error.message,
      projectData: req.body,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas tworzenia projektu', error: error.message });
  }
});

// PUT /api/projects/:id - Aktualizuj projekt
router.put('/:id', async (req, res) => {
  try {
    const { name, description, status, priority, startDate, endDate, teamMembers } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }
    
    // Sprawdź czy użytkownik ma prawo do edycji
    if (project.owner.toString() !== req.user.id && req.user.role !== 'Administrator') {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego projektu' });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        status,
        priority,
        startDate,
        endDate,
        teamMembers
      },
      { new: true, runValidators: true }
    )
    .populate('owner', 'firstName lastName username')
    .populate('teamMembers', 'firstName lastName username');
    
    res.json(updatedProject);
  } catch (error) {
    logger.logDatabase('update', 'projects', false, { 
      error: error.message,
      projectId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas aktualizacji projektu', error: error.message });
  }
});

// DELETE /api/projects/:id - Usuń projekt
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }
    
    // Sprawdź czy użytkownik ma prawo do usunięcia
    if (project.owner.toString() !== req.user.id && req.user.role !== 'Administrator') {
      return res.status(403).json({ message: 'Brak uprawnień do usunięcia tego projektu' });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Projekt został usunięty' });
  } catch (error) {
    logger.logDatabase('delete', 'projects', false, { 
      error: error.message,
      projectId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas usuwania projektu', error: error.message });
  }
});

module.exports = router;
