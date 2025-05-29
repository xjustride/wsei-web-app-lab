const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const logger = require("../utils/logger");

// GET /api/stories - Pobierz wszystkie historie (z opcjonalnym filtrem po projekcie)
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { project: projectId } : {};
    
    logger.debug("Fetching stories", { 
      projectId,
      userId: req.user?.id 
    });
    
    const stories = await Story.find(filter)
      .populate("project", "name")
      .populate("assignedTo", "firstName lastName username")
      .populate("createdBy", "firstName lastName username")
      .sort({ createdAt: -1 });
    
    logger.logDatabase("find", "stories", true, { 
      count: stories.length,
      projectId,
      userId: req.user?.id 
    });
    
    res.json(stories);
  } catch (error) {
    logger.logDatabase("find", "stories", false, { 
      error: error.message,
      projectId: req.query.projectId,
      userId: req.user?.id 
    });
    res.status(500).json({ message: "Błąd podczas pobierania stories", error: error.message });
  }
});

module.exports = router;
