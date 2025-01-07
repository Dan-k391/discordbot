import DatabaseConstructor from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function getDBInstance() {
    const dbPath = path.resolve(process.cwd(), './data/voice_channel_usage.db');

    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new DatabaseConstructor(dbPath, { verbose: console.log });

    // Create the table if it doesn’t exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS voice_sessions (
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            session_start TEXT NOT NULL,
            session_end TEXT,
            duration_seconds INTEGER,
            PRIMARY KEY (user_id, channel_id, session_start)
        )
    `;
    db.exec(createTableQuery);
    console.log('Table "voice_sessions" is ready or already exists.');

    return db;
}
