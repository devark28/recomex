import pool from '../db/connection';
import { Client } from '../types';

export class ClientService {
  static async createClient(name: string, ownerId: number, securityToken: string): Promise<Client> {
    const result = await pool.query(
      'INSERT INTO clients (name, owner_id, security_token) VALUES ($1, $2, $3) RETURNING *',
      [name, ownerId, securityToken]
    );
    return result.rows[0];
  }

  static async getClientsByOwner(ownerId: number): Promise<Client[]> {
    const result = await pool.query('SELECT * FROM clients WHERE owner_id = $1', [ownerId]);
    return result.rows;
  }

  static async getClientById(id: number): Promise<Client | null> {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async updateLastCheckIn(clientId: number): Promise<void> {
    await pool.query(
      'UPDATE clients SET last_check_in = CURRENT_TIMESTAMP WHERE id = $1',
      [clientId]
    );
  }

  static async deleteClient(id: number, ownerId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND owner_id = $2',
      [id, ownerId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }
}