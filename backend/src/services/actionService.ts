import pool from '../db/connection';
import {Action} from '../types';

export class ActionService {
    static async createAction(
        clientId: number,
        type: string,
        payload: string,
        dueAt?: Date
    ): Promise<Action> {
        const result = await pool.query(
            'INSERT INTO actions (client_id, type, payload, due_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [clientId, type, payload, dueAt]
        );
        return result.rows[0];
    }

    static async getPendingActions(clientId: number): Promise<Action[]> {
        const result = await pool.query(
            `SELECT *
             FROM actions
             WHERE client_id = $1
               AND is_sent = FALSE
               AND (due_at IS NULL OR due_at <= CURRENT_TIMESTAMP)
             ORDER BY created_at`,
            [clientId]
        );
        return result.rows;
    }

    static async markActionAsSent(actionId: number): Promise<void> {
        await pool.query(
            'UPDATE actions SET is_sent = TRUE WHERE id = $1',
            [actionId]
        );
    }

    static async updateActionFailure(actionId: number, failureReason: string): Promise<void> {
        await pool.query(
            'UPDATE actions SET failure_reason = $1, is_sent = TRUE WHERE id = $2',
            [failureReason, actionId]
        );
    }

    static async getActionsByClient(clientId: number): Promise<Action[]> {
        const result = await pool.query(
            'SELECT * FROM actions WHERE client_id = $1 ORDER BY created_at DESC',
            [clientId]
        );
        return result.rows;
    }
}