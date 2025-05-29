const Project = require('../models/Project');
const logger = require('../utils/logger');

exports.deleteProject = async (req, res) => {
  const userId = req.user?.id;
  const projectId = req.params.id;
  logger.debug('deleteProject invoked', { projectId, userId });
  
  try {
    const proj = await Project.findById(projectId);
    if (!proj) {
      logger.warn('deleteProject failed - project not found', { projectId, userId });
      return res.status(404).json({ error: 'Not found' });
    }

    const ownerId = proj.createdBy.toString();
    logger.debug('deleteProject ownership check', { projectId, ownerId, userId });

    if (ownerId !== userId) {
      logger.error('deleteProject forbidden - user is not owner', { projectId, ownerId, userId });
      return res.status(403).json({ error: 'Forbidden' });
    }

    await proj.remove();
    logger.logDatabase('delete', 'projects', true, { projectId, userId });
    res.status(204).end();
  } catch (err) {
    logger.logDatabase('delete', 'projects', false, { error: err.message, projectId, userId });
    logger.error('deleteProject encountered error', { error: err.message, projectId, userId });
    res.status(500).json({ error: err.message });
  }
};
