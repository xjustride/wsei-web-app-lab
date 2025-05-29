const Story = require('../models/Story');

exports.createStory = async (req, res) => {
  try {
    const story = await Story.create(req.body);
    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getStories = async (req, res) => {
  try {
    const filter = req.query.project ? { project: req.query.project } : {};
    const stories = await Story.find(filter).populate('tasks');
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate('tasks');
    if (!story) return res.status(404).end();
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
