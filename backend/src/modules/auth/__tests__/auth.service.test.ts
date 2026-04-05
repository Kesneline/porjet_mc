/**
 * @file src/modules/auth/__tests__/auth.service.test.ts
 * @description Unit tests for AuthService (register, login, refresh, logout)
 */

import { AuthService } from '../auth.service';
import { prisma } from '../../../config/prisma.config';
import { AppError } from '../../../middlewares/error.middleware';

// Mock Prisma
jest.mock('../../../config/prisma.config', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock JWT utilities
jest.mock('../../../utils/jwt.utils', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed:${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(password === 'correct-password')),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================================
  // REGISTER TESTS
  // =====================================================================

  describe('register', () => {

    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed:password123',
        role: 'STUDENT',
        university: null,
        phone: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await AuthService.register({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.user.role).toBe('STUDENT');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should reject duplicate email during registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'existing-user',
        email: 'duplicate@example.com',
      });

      await expect(
        AuthService.register({
          email: 'duplicate@example.com',
          name: 'New User',
          password: 'password123',
        })
      ).rejects.toThrow(AppError);

      // Verify error status is 409 (Conflict)
      try {
        await AuthService.register({
          email: 'duplicate@example.com',
          name: 'New User',
          password: 'password123',
        });
      } catch (err) {
        if (err instanceof AppError) {
          expect(err.statusCode).toBe(409);
        }
      }
    });

    it('should include optional fields (university, phone) if provided', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'student@example.com',
        name: 'Student Name',
        password: 'hashed:password',
        role: 'STUDENT',
        university: 'University of Paris',
        phone: '+33612345678',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await AuthService.register({
        email: 'student@example.com',
        name: 'Student Name',
        password: 'password',
        university: 'University of Paris',
        phone: '+33612345678',
      });

      expect(result.user.email).toBe('student@example.com');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            university: 'University of Paris',
            phone: '+33612345678',
          }),
        })
      );
    });
  });

  // =====================================================================
  // LOGIN TESTS
  // =====================================================================

  describe('login', () => {

    it('should successfully login with correct credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed:correct-password',
        role: 'STUDENT',
      };

      const mockRefreshToken = {
        token: 'mock-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce(mockRefreshToken);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'correct-password',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should reject non-existent email with generic error message', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Identifiants incorrects.');
    });

    it('should reject incorrect password with generic error message', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed:correct-password',
        role: 'STUDENT',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Identifiants incorrects.');
    });

    it('should use same error message for email not found and wrong password (prevent user enumeration)', async () => {
      // Both should throw the same message
      const notFoundError = new AppError('Identifiants incorrects.', 401);
      const wrongPasswordError = new AppError('Identifiants incorrects.', 401);

      expect(notFoundError.message).toBe(wrongPasswordError.message);
    });
  });

  // =====================================================================
  // REFRESH TOKEN TESTS
  // =====================================================================

  describe('refreshAccessToken', () => {

    it('should successfully refresh token with valid refresh token', async () => {
      const mockRefreshToken = {
        token: 'valid-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce(mockRefreshToken);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await AuthService.refreshAccessToken({
        refreshToken: 'valid-refresh-token',
      });

      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should reject non-existent refresh token', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        AuthService.refreshAccessToken({
          refreshToken: 'invalid-token',
        })
      ).rejects.toThrow('Refresh Token invalide ou révoqué.');
    });

    it('should reject expired refresh token and delete it', async () => {
      const expiredToken = {
        token: 'expired-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000), // Past
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce(expiredToken);

      await expect(
        AuthService.refreshAccessToken({
          refreshToken: 'expired-refresh-token',
        })
      ).rejects.toThrow('Refresh Token expiré');

      // Verify token was deleted
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'expired-refresh-token' },
      });
    });
  });

  // =====================================================================
  // LOGOUT TESTS
  // =====================================================================

  describe('logout', () => {

    it('should successfully logout and revoke refresh token', async () => {
      const mockRefreshToken = {
        token: 'valid-refresh-token',
        userId: 'user-123',
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce(mockRefreshToken);
      (prisma.refreshToken.delete as jest.Mock).mockResolvedValueOnce(mockRefreshToken);

      const result = await AuthService.logout({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toBeNull();
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token' },
      });
    });

    it('should reject logout for non-existent refresh token', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        AuthService.logout({
          refreshToken: 'non-existent-token',
        })
      ).rejects.toThrow('Refresh Token déjà révoqué ou introuvable.');
    });
  });
});
