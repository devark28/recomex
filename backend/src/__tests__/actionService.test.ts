import { ActionService } from '../services/actionService';
import pool from '../db/connection';

jest.mock('../db/connection');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('ActionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAction', () => {
    it('should create action without due date', async () => {
      const mockAction = { 
        id: 1, 
        client_id: 1, 
        type: 'volume', 
        payload: '{"action":"increase"}',
        due_at: null 
      };
      mockPool.query.mockResolvedValue({ rows: [mockAction] } as never);

      const result = await ActionService.createAction(1, 'volume', '{"action":"increase"}');

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO actions (client_id, type, payload, due_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [1, 'volume', '{"action":"increase"}', undefined]
      );
      expect(result).toEqual(mockAction);
    });

    it('should create action with due date', async () => {
      const dueDate = new Date('2024-01-01T10:00:00Z');
      const mockAction = { 
        id: 1, 
        client_id: 1, 
        type: 'volume', 
        payload: '{"action":"increase"}',
        due_at: dueDate 
      };
      mockPool.query.mockResolvedValue({ rows: [mockAction] } as never);

      const result = await ActionService.createAction(1, 'volume', '{"action":"increase"}', dueDate);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO actions (client_id, type, payload, due_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [1, 'volume', '{"action":"increase"}', dueDate]
      );
      expect(result).toEqual(mockAction);
    });
  });

  describe('getPendingActions', () => {
    it('should return pending actions for client', async () => {
      const mockActions = [
        { id: 1, client_id: 1, is_sent: false },
        { id: 2, client_id: 1, is_sent: false }
      ];
      mockPool.query.mockResolvedValue({ rows: mockActions } as never);

      const result = await ActionService.getPendingActions(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE client_id = $1'),
        [1]
      );
      expect(result).toEqual(mockActions);
    });
  });

  describe('markActionAsSent', () => {
    it('should mark action as sent', async () => {
      mockPool.query.mockResolvedValue({} as never);

      await ActionService.markActionAsSent(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE actions SET is_sent = TRUE WHERE id = $1',
        [1]
      );
    });
  });

  describe('updateActionFailure', () => {
    it('should update action with failure reason', async () => {
      mockPool.query.mockResolvedValue({} as never);

      await ActionService.updateActionFailure(1, 'Connection timeout');

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE actions SET failure_reason = $1, is_sent = TRUE WHERE id = $2',
        ['Connection timeout', 1]
      );
    });
  });

  describe('getActionsByClient', () => {
    it('should return all actions for client', async () => {
      const mockActions = [
        { id: 1, client_id: 1 },
        { id: 2, client_id: 1 }
      ];
      mockPool.query.mockResolvedValue({ rows: mockActions } as never);

      const result = await ActionService.getActionsByClient(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM actions WHERE client_id = $1 ORDER BY created_at DESC',
        [1]
      );
      expect(result).toEqual(mockActions);
    });
  });
});