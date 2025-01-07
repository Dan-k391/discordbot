const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Define the database path
const dbDir = path.resolve(__dirname, '../data');
const dbPath = path.join(dbDir, 'voice_channel_usage.db');

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Open or create the SQLite database
const db = new Database(dbPath, { verbose: console.log });

console.log(`Connected to SQLite database at: ${dbPath}`);

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

// Close the database connection
db.close();
console.log('Database connection closed.');
