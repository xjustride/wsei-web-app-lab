const express = require('express');
const app = express();

// add body-parser
app.use(express.json());

// ...existing middleware (e.g. app.use(express.urlencoded({ extended: true })))...

// ...existing route mounts...
// e.g. app.use('/api/tasks', taskRoutes);

// mount story routes
app.use('/api/stories', require('./routes/stories'));

// mount project routes
app.use('/api/projects', require('./routes/projectRoutes'));

// ...existing error handlers and server startup...
