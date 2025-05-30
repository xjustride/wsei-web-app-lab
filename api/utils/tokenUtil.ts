import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  try {
    // Generate a random token
    const tokenValue = crypto.randomBytes(64).toString('hex');
    
    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Save to database
    const refreshToken = new RefreshToken({
      userId,
      token: tokenValue,
      expiresAt
    });
    
    await refreshToken.save();
    return tokenValue;
  } catch (error) {
    throw new Error('Failed to generate refresh token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
  } catch (error) {
    return null;
  }
};
