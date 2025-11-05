import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';
import {User} from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class UserService {
    static async register(username: string, password: string): Promise<User> {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
            [username, passwordHash]
        );
        return result.rows[0];
    }

    static async login(username: string, password: string): Promise<string | null> {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return null;
        }

        return jwt.sign({userId: user.id, username: user.username}, JWT_SECRET);
    }

    static async getUserById(id: number): Promise<User | null> {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
}