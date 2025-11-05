import 'dotenv/config';
import pool from '../db/connection';

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users
            (
                id            SERIAL PRIMARY KEY,
                username      VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255)        NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS clients
            (
                id                 SERIAL PRIMARY KEY,
                name               VARCHAR(255) NOT NULL,
                owner_id           INTEGER REFERENCES users (id) ON DELETE CASCADE,
                security_token     TEXT,
                registration_token VARCHAR(255) UNIQUE,
                is_active          BOOLEAN   DEFAULT FALSE,
                last_check_in      TIMESTAMP,
                created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS actions
            (
                id             SERIAL PRIMARY KEY,
                client_id      INTEGER REFERENCES clients (id) ON DELETE CASCADE,
                type           VARCHAR(50) NOT NULL,
                payload        TEXT        NOT NULL,
                due_at         TIMESTAMP,
                is_sent        BOOLEAN   DEFAULT FALSE,
                failure_reason TEXT,
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initDb();