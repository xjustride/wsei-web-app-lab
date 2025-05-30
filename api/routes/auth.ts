import express from 'express';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/tokenUtil';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Authentication middleware for protected routes
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }
  
  const token = authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  // Verify token
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  
  // Attach user to request object
  req.user = decoded;
  next();
};

// Get current authenticated user
router.get('/me', authenticate, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user.id)
      .select('firstName lastName email role avatar createdAt')
      .lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(user._id.toString());
    res.json({
      user: {
        id: user._id.toString(), // Use user._id.toString()
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser: IUser | null = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const user: IUser = new User({
      firstName,
      lastName,
      email,
      passwordHash: password,
      role
    });
    await user.save();
    
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(user._id.toString());
    res.status(201).json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Google OAuth login endpoint
router.post('/google', async (req, res) => {
  try {
    console.log('Google OAuth request body:', req.body);
    console.log('Google OAuth request headers:', req.headers);
    
    const { token } = req.body;
    
    console.log('Extracted token:', token);
    console.log('Token type:', typeof token);
    console.log('Token length:', token?.length);
    
    if (!token) {
      console.log('No token provided');
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google info if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      // Create new user with guest role
      user = new User({
        firstName: firstName || 'User',
        lastName: lastName || '',
        email,
        googleId,
        authProvider: 'google',
        role: 'guest',
        avatar
      });
      await user.save();
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(user._id.toString());

    res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Server error during Google authentication', error: (error as Error).message });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken, userId } = req.body;
    if (!refreshToken || !userId) {
      return res.status(400).json({ message: 'Refresh token and user ID are required' });
    }
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, userId, expiresAt: { $gt: new Date() } });
    if (!tokenDoc) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = await generateRefreshToken(userId);
    await RefreshToken.deleteOne({ token: refreshToken });
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;