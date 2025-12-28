import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { verifyToken } from '../utils/jwt';
import { Session } from '../models/Session.model';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);

    if (!user || user.isDeleted || user.status !== 'active') {
      res.status(401).json({ message: 'Invalid or inactive user' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }

    const decoded = verifyToken(refreshToken);
    const session = await Session.findOne({
      refreshToken,
      userId: decoded.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.isDeleted || user.status !== 'active') {
      res.status(401).json({ message: 'Invalid or inactive user' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

