const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Story = require('../models/Story');
const logger = require('../utils/logger');

// GET /api/tasks - Pobierz wszystkie zadania (z filtrami)
router.get('/', async (req, res) => {
  try {
    const { projectId, storyId, state } = req.query;
    const filter = {};
    
    if (projectId) filter.project = projectId;
    if (storyId) filter.story = storyId;
    if (state) filter.state = state;
    
    logger.debug('Fetching tasks', { 
      projectId,
      storyId,
      state,
      userId: req.user?.id 
    });
    
    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('story', 'name')
      .populate('assignedTo', 'firstName lastName username')
      .populate('createdBy', 'firstName lastName username')
      .sort({ createdAt: -1 });
    
    logger.logDatabase('find', 'tasks', true, { 
      count: tasks.length,
      projectId,
      storyId,
      state,
      userId: req.user?.id 
    });
    
    res.json(tasks);
  } catch (error) {
    logger.logDatabase('find', 'tasks', false, { 
      error: error.message,
      projectId: req.query.projectId,
      storyId: req.query.storyId,
      state: req.query.state,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas pobierania zadań', error: error.message });
  }
});

// GET /api/tasks/:id - Pobierz konkretne zadanie
router.get('/:id', async (req, res) => {
  try {
    logger.debug('Fetching task by ID', { 
      taskId: req.params.id,
      userId: req.user?.id 
    });
    
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('story', 'name')
      .populate('assignedTo', 'firstName lastName username')
      .populate('createdBy', 'firstName lastName username');
    
    if (!task) {
      logger.warn('Task not found', { 
        taskId: req.params.id,
        userId: req.user?.id 
      });
      return res.status(404).json({ message: 'Zadanie nie zostało znalezione' });
    }
    
    logger.logDatabase('findById', 'tasks', true, { 
      taskId: req.params.id,
      userId: req.user?.id 
    });
    
    res.json(task);
  } catch (error) {
    logger.logDatabase('findById', 'tasks', false, { 
      error: error.message,
      taskId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas pobierania zadania', error: error.message });
  }
});

// POST /api/tasks - Utwórz nowe zadanie
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      priority, 
      state, 
      estimatedTime, 
      project, 
      story, 
      assignedTo,
      startDate,
      endDate
    } = req.body;
    
    if (!project || !story) {
      logger.warn('Task creation failed - missing required fields', { 
        hasProject: !!project,
        hasStory: !!story,
        userId: req.user?.id 
      });
      return res.status(400).json({ message: 'ID projektu i historii są wymagane' });
    }
    
    logger.debug('Creating new task', { 
      name,
      project,
      story,
      priority: priority || 'medium',
      state: state || 'todo',
      userId: req.user?.id 
    });
    
    const task = new Task({
      name,
      description,
      priority: priority || 'medium',
      state: state || 'todo',
      estimatedTime: estimatedTime || 0,
      project,
      story,
      assignedTo,
      createdBy: req.user.id,
      startDate,
      endDate
    });
    
    const savedTask = await task.save();
    const populatedTask = await Task.findById(savedTask._id)
      .populate('project', 'name')
      .populate('story', 'name')
      .populate('assignedTo', 'firstName lastName username')
      .populate('createdBy', 'firstName lastName username');
    
    logger.logDatabase('create', 'tasks', true, { 
      taskId: savedTask._id.toString(),
      name: savedTask.name,
      project,
      story,
      userId: req.user?.id 
    });
    
    res.status(201).json(populatedTask);
  } catch (error) {
    logger.logDatabase('create', 'tasks', false, { 
      error: error.message,
      taskData: req.body,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas tworzenia zadania', error: error.message });
  }
});

// PUT /api/tasks/:id - Aktualizuj zadanie
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      priority, 
      state, 
      estimatedTime, 
      assignedTo,
      startDate,
      endDate
    } = req.body;
    
    logger.debug('Updating task', { 
      taskId: req.params.id,
      updates: Object.keys(req.body),
      userId: req.user?.id 
    });
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      logger.warn('Task not found for update', { 
        taskId: req.params.id,
        userId: req.user?.id 
      });
      return res.status(404).json({ message: 'Zadanie nie zostało znalezione' });
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        priority,
        state,
        estimatedTime,
        assignedTo,
        startDate,
        endDate
      },
      { new: true, runValidators: true }
    )
    .populate('project', 'name')
    .populate('story', 'name')
    .populate('assignedTo', 'firstName lastName username')
    .populate('createdBy', 'firstName lastName username');
    
    logger.logDatabase('update', 'tasks', true, { 
      taskId: req.params.id,
      userId: req.user?.id 
    });
    
    res.json(updatedTask);
  } catch (error) {
    logger.logDatabase('update', 'tasks', false, { 
      error: error.message,
      taskId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas aktualizacji zadania', error: error.message });
  }
});

// DELETE /api/tasks/:id - Usuń zadanie
router.delete('/:id', async (req, res) => {
  try {
    logger.debug('Deleting task', { 
      taskId: req.params.id,
      userId: req.user?.id 
    });
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      logger.warn('Task not found for deletion', { 
        taskId: req.params.id,
        userId: req.user?.id 
      });
      return res.status(404).json({ message: 'Zadanie nie zostało znalezione' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    logger.logDatabase('delete', 'tasks', true, { 
      taskId: req.params.id,
      userId: req.user?.id 
    });
    
    res.json({ message: 'Zadanie zostało usunięte' });
  } catch (error) {
    logger.logDatabase('delete', 'tasks', false, { 
      error: error.message,
      taskId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas usuwania zadania', error: error.message });
  }
});

// POST /api/tasks/:id/stories - add a story to a task
router.post('/:id/stories', async (req, res) => {
  const taskId = req.params.id;
  const { storyId } = req.body;
  logger.debug('Adding story to task', { taskId, storyId, userId: req.user?.id });
  try {
    const story = await Story.findById(storyId);
    if (!story) {
      logger.warn('Story not found for assignment', { storyId, taskId });
      return res.status(404).json({ message: 'Historia nie została znaleziona' });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      logger.warn('Task not found for story assignment', { taskId });
      return res.status(404).json({ message: 'Zadanie nie zostało znalezione' });
    }
    task.stories = task.stories || [];
    if (!task.stories.includes(storyId)) {
      task.stories.push(storyId);
      await task.save();
      logger.logDatabase('update', 'tasks', true, { taskId, storyId, userId: req.user?.id });
    }
    const populated = await Task.findById(taskId)
      .populate('stories', 'name description state');
    res.json(populated);
  } catch (error) {
    logger.logDatabase('update', 'tasks', false, { error: error.message, taskId, storyId });
    res.status(500).json({ message: 'Błąd podczas dodawania historii do zadania', error: error.message });
  }
});

module.exports = router;
