import { ClientService } from '../services/clientService';
import pool from '../db/connection';

jest.mock('../db/connection');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a new client with registration token', async () => {
      const mockClient = { 
        id: 1, 
        name: 'Test Client', 
        owner_id: 1, 
        registration_token: 'abc123',
        is_active: false 
      };
      mockPool.query.mockResolvedValue({ rows: [mockClient] } as never);

      const result = await ClientService.createClient('Test Client', 1);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO clients (name, owner_id, registration_token, is_active) VALUES ($1, $2, $3, FALSE) RETURNING *',
        ['Test Client', 1, expect.any(String)]
      );
      expect(result).toEqual(mockClient);
    });
  });

  describe('activateClient', () => {
    it('should activate client with valid registration token', async () => {
      const mockClient = { 
        id: 1, 
        name: 'Test Client', 
        security_token: 'publickey',
        is_active: true 
      };
      mockPool.query.mockResolvedValue({ rows: [mockClient] } as never);

      const result = await ClientService.activateClient('regtoken', 'publickey', 'Test Client');

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE clients SET security_token = $1, name = $2, is_active = TRUE, registration_token = NULL WHERE registration_token = $3 RETURNING *',
        ['publickey', 'Test Client', 'regtoken']
      );
      expect(result).toEqual(mockClient);
    });

    it('should throw error for invalid registration token', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as never);

      await expect(ClientService.activateClient('invalid', 'publickey', 'Test Client'))
        .rejects.toThrow('Invalid registration token');
    });
  });

  describe('getClientsByOwner', () => {
    it('should return clients for owner', async () => {
      const mockClients = [{ id: 1, name: 'Client 1' }, { id: 2, name: 'Client 2' }];
      mockPool.query.mockResolvedValue({ rows: mockClients } as never);

      const result = await ClientService.getClientsByOwner(1);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM clients WHERE owner_id = $1', [1]);
      expect(result).toEqual(mockClients);
    });
  });

  describe('deleteClient', () => {
    it('should delete client and return true when successful', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as never);

      const result = await ClientService.deleteClient(1, 1);

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM clients WHERE id = $1 AND owner_id = $2',
        [1, 1]
      );
      expect(result).toBe(true);
    });

    it('should return false when client not found or not owned', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 } as never);

      const result = await ClientService.deleteClient(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('updateLastCheckIn', () => {
    it('should update client last check-in timestamp', async () => {
      mockPool.query.mockResolvedValue({} as never);

      await ClientService.updateLastCheckIn(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE clients SET last_check_in = CURRENT_TIMESTAMP WHERE id = $1',
        [1]
      );
    });
  });
});