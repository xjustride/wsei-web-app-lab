const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'managme-jwt-secret-key';
const REFRESH_SECRET = 'managme-refresh-secret-key';

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

const refreshTokens = new Map();

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

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.status(200).json({
    token,
    refreshToken
  });
});

// Endpoint do logowania przez Google
app.post('/api/auth/google-login', (req, res) => {
  const { googleProfile } = req.body;
  
  if (!googleProfile || !googleProfile.sub) {
    return res.status(400).json({ message: 'Nieprawidłowe dane profilu Google' });
  }
  
  // Generowanie unikalnego identyfikatora dla użytkownika Google
  const userId = `google-${googleProfile.sub}`;
  
  // Sprawdzenie czy użytkownik Google już istnieje w systemie
  let user = users.find(u => u.id === userId);
  
  // Jeśli nie istnieje, tworzymy nowego użytkownika
  if (!user) {
    user = {
      id: userId,
      username: googleProfile.email,
      firstName: googleProfile.given_name,
      lastName: googleProfile.family_name,
      role: 'GUEST' // Używamy stałej wartości zgodnej z enumem UserRole.GUEST w kliencie
    };
    
    // Dodajemy użytkownika do systemu
    users.push(user);
  }
  
  // Tworzenie tokenu JWT
  const token = jwt.sign(
    { id: user.id, username: user.username }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  // Tworzenie refresh tokenu
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Zapisanie refresh tokenu
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dni
  });
  
  res.status(200).json({
    token,
    refreshToken
  });
});

app.post('/api/auth/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    return res.status(401).json({ message: 'Nieważny lub wygasły refresh token' });
  }
  
  const user = users.find(u => u.id === tokenData.userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
  }
  
  const newToken = jwt.sign(
    { id: user.id, username: user.username }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  
  refreshTokens.delete(refreshToken);
  refreshTokens.set(newRefreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.status(200).json({
    token: newToken,
    refreshToken: newRefreshToken
  });
});

app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
  }
  
  const { password, ...userWithoutPassword } = user;
  
  res.status(200).json(userWithoutPassword);
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
