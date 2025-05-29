const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectController');

// ...existing GET/POST/PUT routes...
router.delete('/:id', ctrl.deleteProject);

module.exports = router;
