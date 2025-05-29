const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/storyController');

// POST /api/stories
router.post('/',    ctrl.createStory);
// GET /api/stories?project=<id>
router.get('/',     ctrl.getStories);
// GET /api/stories/:id
router.get('/:id',  ctrl.getStoryById);

module.exports = router;
