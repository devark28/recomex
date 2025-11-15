import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiService from '../services/api';

// Mock fetch
// @ts-ignore
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
// @ts-ignore
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = { token: 'jwt-token', user: { id: 1, username: 'test' } };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await ApiService.login('testuser', 'password');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password' }),
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed login', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await expect(ApiService.login('testuser', 'wrongpass'))
        .rejects.toThrow('HTTP error! status: 401');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = { message: 'User created' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await ApiService.register('newuser', 'password');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "Authorization": "Bearer jwt-token" },
        body: JSON.stringify({ username: 'newuser', password: 'password' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getClients', () => {
    it('should fetch clients with auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token');
      const mockClients = [{ id: 1, name: 'Client 1' }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockClients),
      } as Response);

      const result = await ApiService.getClients();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/clients', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token',
        },
      });
      expect(result).toEqual(mockClients);
    });
  });

  describe('createClient', () => {
    it('should create client with auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token');
      const mockClient = { id: 1, name: 'New Client', registration_token: 'abc123' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockClient),
      } as Response);

      const result = await ApiService.createClient('New Client');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token',
        },
        body: JSON.stringify({ name: 'New Client' }),
      });
      expect(result).toEqual(mockClient);
    });
  });

  describe('deleteClient', () => {
    it('should delete client with auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token');
      const mockResponse = { message: 'Client deleted' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await ApiService.deleteClient(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/clients/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendAction', () => {
    it('should send action without due date', async () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token');
      const mockResponse = { id: 1, message: 'Action sent' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await ApiService.sendAction(1, 'volume', '{"action":"increase"}');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token',
        },
        body: JSON.stringify({
          clientId: 1,
          type: 'volume',
          payload: '{"action":"increase"}',
          dueAt: undefined,
        }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should clear token from localStorage', () => {
      ApiService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token');
      
      // Create new instance to pick up the mocked localStorage
      const apiService = new (ApiService.constructor as any)();
      expect(apiService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const apiService = new (ApiService.constructor as any)();
      expect(apiService.isAuthenticated()).toBe(false);
    });
  });
});