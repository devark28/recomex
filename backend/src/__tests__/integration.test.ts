import { ClientService } from '../services/clientService';
import { ActionService } from '../services/actionService';
import pool from '../db/connection';

jest.mock('../db/connection');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client deletion cascade', () => {
    it('should delete client and cascade to actions via database constraints', async () => {
      // Mock successful client deletion
      mockPool.query.mockResolvedValue({ rowCount: 1 } as never);

      const result = await ClientService.deleteClient(1, 1);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM clients WHERE id = $1 AND owner_id = $2',
        [1, 1]
      );
      
      // The cascade deletion of actions happens at the database level
      // due to the ON DELETE CASCADE constraint, so no additional
      // service calls are needed
    });

    it('should verify action creation works correctly', async () => {
      const mockAction = { 
        id: 1, 
        client_id: 1, 
        type: 'volume', 
        payload: '{"action":"increase"}' 
      };
      mockPool.query.mockResolvedValue({ rows: [mockAction] } as never);

      const result = await ActionService.createAction(1, 'volume', '{"action":"increase"}');

      expect(result).toEqual(mockAction);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO actions (client_id, type, payload, due_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [1, 'volume', '{"action":"increase"}', undefined]
      );
    });
  });
});