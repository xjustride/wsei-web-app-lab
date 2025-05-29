const logger = require('../utils/logger');

// HTTP request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response time
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the request
    logger.logRequest(req, res, responseTime);
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error with full details
  logger.error('Unhandled error in request', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      body: req.body,
      query: req.query,
      params: req.params
    }
  });

  // Send error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress
  });
  
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
};

module.exports = {
  requestLogger,
  errorHandler,
  notFoundHandler
};
