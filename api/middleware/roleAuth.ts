import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware to check if user has required role
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to block guests from write operations
export const blockGuestWrites = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Block write operations for guests
  if (req.user.role === 'guest' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({ 
      message: 'Goście mają dostęp tylko do odczytu. Nie można wykonywać operacji zapisu.',
      userRole: req.user.role
    });
  }

  next();
};

// Specific role checks
export const requireAdmin = requireRole(['admin']);
export const requireDeveloperOrAbove = requireRole(['admin', 'developer']);
export const requireDevOpsOrAbove = requireRole(['admin', 'devops']);
export const requireAnyRole = requireRole(['admin', 'developer', 'devops', 'guest']);