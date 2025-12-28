import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/User.model';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { Session } from '../models/Session.model';
import { CustomError } from '../middleware/error.middleware';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (await User.findOne({ email, isDeleted: false })) {
      throw new CustomError('Email already registered', 400);
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role === 'admin' ? UserRole.ADMIN : UserRole.SELLER;

    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: userRole,
    });

    await user.save();

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Session.create({
      userId: user._id,
      refreshToken,
      deviceInfo: {
        userAgent: req.get('user-agent') || '',
        ipAddress: req.ip || '',
      },
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isDeleted: false }).select('+password');

    if (!user || !(await comparePassword(password, user.password))) {
      throw new CustomError('Invalid credentials', 401);
    }

    if (user.status !== 'active') {
      throw new CustomError('Account is not active', 403);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Session.create({
      userId: user._id,
      refreshToken,
      deviceInfo: {
        userAgent: req.get('user-agent') || '',
        ipAddress: req.ip || '',
      },
      expiresAt,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const session = await Session.findOne({
      refreshToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new CustomError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(session.userId);

    if (!user || user.isDeleted || user.status !== 'active') {
      throw new CustomError('Invalid user', 401);
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);

    session.lastUsedAt = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await Session.updateOne(
        { refreshToken },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

