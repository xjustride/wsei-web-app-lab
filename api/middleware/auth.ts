import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtil';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }
  
  const token = authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  
  req.user = decoded;
  next();
};

export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};