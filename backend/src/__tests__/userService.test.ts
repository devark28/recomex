import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/userService';
import pool from '../db/connection';

jest.mock('../db/connection');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockPool = pool as jest.Mocked<typeof pool>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const mockUser = { id: 1, username: 'testuser', password_hash: 'hashedpass' };
      mockBcrypt.hash.mockResolvedValue('hashedpass' as never);
      mockPool.query.mockResolvedValue({ rows: [mockUser] } as never);

      const result = await UserService.register('testuser', 'password');

      expect(mockBcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
        ['testuser', 'hashedpass']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      const mockUser = { id: 1, username: 'testuser', password_hash: 'hashedpass' };
      mockPool.query.mockResolvedValue({ rows: [mockUser] } as never);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('jwt-token' as never);

      const result = await UserService.login('testuser', 'password');

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE username = $1', ['testuser']);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password', 'hashedpass');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 1, username: 'testuser' },
        expect.any(String)
      );
      expect(result).toBe('jwt-token');
    });

    it('should return null for invalid credentials', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as never);

      const result = await UserService.login('testuser', 'wrongpass');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockPool.query.mockResolvedValue({ rows: [mockUser] } as never);

      const result = await UserService.getUserById(1);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as never);

      const result = await UserService.getUserById(999);

      expect(result).toBeNull();
    });
  });
});