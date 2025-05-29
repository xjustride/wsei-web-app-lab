require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Import logging utilities
const logger = require('./utils/logger');
const { requestLogger, errorHandler, notFoundHandler } = require('./middleware/logging');

// Import MongoDB connection and models
const connectDB = require('./config/database');
const User = require('./models/User');

// Import routes
const projectRoutes = require('./routes/projects');
const storyRoutes = require('./routes/stories');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Add request logging middleware
app.use(requestLogger);

const JWT_SECRET = process.env.JWT_SECRET || 'managme-jwt-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'managme-refresh-secret-key';

// Hardcoded users for initial setup - in production move to database
const defaultUsers = [
  {
    username: 'admin',
    password: 'admin123', // In production, this would be hashed
    firstName: 'Jan',
    lastName: 'Kowalski',
    role: 'Administrator'
  },
  {
    username: 'developer',
    password: 'dev123',
    firstName: 'Anna',
    lastName: 'Nowak',
    role: 'Developer'
  },
  {
    username: 'devops',
    password: 'ops123',
    firstName: 'Piotr',
    lastName: 'Wiśniewski',
    role: 'DevOps'
  }
];

// Initialize default users if they don't exist
const initializeDefaultUsers = async () => {
  try {
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        logger.info(`Created default user: ${userData.username}`, { username: userData.username, role: userData.role });
      }
    }
    logger.info('Default users initialization completed');
  } catch (error) {
    logger.error('Error initializing default users', { 
      error: error.message, 
      stack: error.stack 
    });
  }
};

// Call initialization
initializeDefaultUsers();

const refreshTokens = new Map();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    logger.warn('Authentication failed: No token provided', { 
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl 
    });
    return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Authentication failed: Invalid token', { 
        error: err.message,
        ip: req.ip || req.connection.remoteAddress,
        url: req.originalUrl 
      });
      return res.status(401).json({ message: 'Token nieważny lub wygasł' });
    }
    
    req.user = user;
    next();
  });
};

// Use routes with authentication middleware
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/stories', authenticateToken, storyRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    logger.debug('Login attempt', { username });
    
    const user = await User.findOne({ username, password });
    
    if (!user) {
      logger.logAuth('login', username, false, { 
        reason: 'Invalid credentials',
        ip: req.ip || req.connection.remoteAddress 
      });
      return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '15m' }
    );
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    refreshTokens.set(refreshToken, {
      userId: user._id.toString(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    logger.logAuth('login', username, true, { 
      userId: user._id.toString(),
      role: user.role,
      ip: req.ip || req.connection.remoteAddress 
    });
    
    res.status(200).json({
      token,
      refreshToken
    });
  } catch (error) {
    logger.error('Login error', { 
      error: error.message, 
      stack: error.stack,
      username: req.body?.username 
    });
    res.status(500).json({ message: 'Błąd podczas logowania' });
  }
});

// Endpoint do logowania przez Google
app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { googleProfile } = req.body;
    
    logger.debug('Google login attempt', { email: googleProfile?.email });
    
    if (!googleProfile || !googleProfile.sub) {
      logger.warn('Google login failed: Invalid profile data', { 
        profileData: googleProfile,
        ip: req.ip || req.connection.remoteAddress 
      });
      return res.status(400).json({ message: 'Nieprawidłowe dane profilu Google' });
    }
    
    // Sprawdzenie czy użytkownik Google już istnieje w systemie
    let user = await User.findOne({ googleId: googleProfile.sub });
    
    // Jeśli nie istnieje, tworzymy nowego użytkownika
    if (!user) {
      user = new User({
        username: googleProfile.email,
        password: crypto.randomBytes(32).toString('hex'), // Random password for Google users
        firstName: googleProfile.given_name,
        lastName: googleProfile.family_name,
        role: 'User',
        googleId: googleProfile.sub,
        email: googleProfile.email
      });
      
      await user.save();
      logger.info('New Google user created', { 
        userId: user._id.toString(),
        email: googleProfile.email 
      });
    }
    
    // Tworzenie tokenu JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '15m' }
    );
    
    // Tworzenie refresh tokenu
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Zapisanie refresh tokenu
    refreshTokens.set(refreshToken, {
      userId: user._id.toString(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dni
    });
    
    logger.logAuth('google-login', googleProfile.email, true, { 
      userId: user._id.toString(),
      googleId: googleProfile.sub,
      ip: req.ip || req.connection.remoteAddress 
    });
    
    res.status(200).json({
      token,
      refreshToken
    });
  } catch (error) {
    logger.error('Google login error', { 
      error: error.message, 
      stack: error.stack,
      email: req.body?.googleProfile?.email 
    });
    res.status(500).json({ message: 'Błąd podczas logowania przez Google' });
  }
});

app.post('/api/auth/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  logger.debug('Refresh token request', { hasToken: !!refreshToken });
  
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    logger.warn('Refresh token failed', { 
      reason: !tokenData ? 'Token not found' : 'Token expired',
      ip: req.ip || req.connection.remoteAddress 
    });
    return res.status(401).json({ message: 'Nieważny lub wygasły refresh token' });
  }
  
  User.findById(tokenData.userId)
    .then(user => {
      if (!user) {
        logger.error('Refresh token failed: User not found', { 
          userId: tokenData.userId 
        });
        return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
      }
      
      const newToken = jwt.sign(
        { id: user._id, username: user.username, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '15m' }
      );
      
      const newRefreshToken = crypto.randomBytes(40).toString('hex');
      
      refreshTokens.delete(refreshToken);
      refreshTokens.set(newRefreshToken, {
        userId: user._id.toString(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      logger.info('Token refreshed successfully', { 
        userId: user._id.toString(),
        username: user.username 
      });
      
      res.status(200).json({
        token: newToken,
        refreshToken: newRefreshToken
      });
    })
    .catch(error => {
      logger.error('Refresh token error', { 
        error: error.message, 
        stack: error.stack,
        userId: tokenData.userId 
      });
      res.status(500).json({ message: 'Błąd podczas odświeżania tokenu' });
    });
});

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      logger.warn('User profile fetch failed: User not found', { 
        userId: req.user.id 
      });
      return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }
    
    logger.debug('User profile fetched successfully', { 
      userId: user._id.toString(),
      username: user.username 
    });
    
    res.status(200).json(user);
  } catch (error) {
    logger.error('Get user error', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Błąd podczas pobierania danych użytkownika' });
  }
});

// Add error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API server started successfully`, { 
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'INFO'
  });
});
