const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// JWT Secret keys
const JWT_SECRET = 'managme-jwt-secret-key';
const REFRESH_SECRET = 'managme-refresh-secret-key';

// In-memory database (for demo purposes)
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // In production, this would be hashed
    firstName: 'Jan',
    lastName: 'Kowalski',
    role: 'Administrator'
  },
  {
    id: '2',
    username: 'developer',
    password: 'dev123',
    firstName: 'Anna',
    lastName: 'Nowak',
    role: 'Developer'
  },
  {
    id: '3',
    username: 'devops',
    password: 'ops123',
    firstName: 'Piotr',
    lastName: 'Wiśniewski',
    role: 'DevOps'
  }
];

// Store refresh tokens (in production, use a database)
const refreshTokens = new Map();

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Token nieważny lub wygasł' });
    }
    
    req.user = user;
    next();
  });
};

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Find user
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
  }
  
  // Create JWT token (expires in 15 minutes)
  const token = jwt.sign(
    { id: user.id, username: user.username }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  // Create refresh token (expires in 7 days)
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Store refresh token with user id
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  // Send tokens to client
  res.status(200).json({
    token,
    refreshToken
  });
});

// Refresh token endpoint
app.post('/api/auth/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  // Check if refresh token exists and is valid
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    return res.status(401).json({ message: 'Nieważny lub wygasły refresh token' });
  }
  
  // Find user
  const user = users.find(u => u.id === tokenData.userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
  }
  
  // Create new JWT token
  const newToken = jwt.sign(
    { id: user.id, username: user.username }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  // Create new refresh token
  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  
  // Delete old refresh token and store new one
  refreshTokens.delete(refreshToken);
  refreshTokens.set(newRefreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  // Send new tokens to client
  res.status(200).json({
    token: newToken,
    refreshToken: newRefreshToken
  });
});

// Get current user endpoint
app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
  }
  
  // Return user info without password
  const { password, ...userWithoutPassword } = user;
  
  res.status(200).json(userWithoutPassword);
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
