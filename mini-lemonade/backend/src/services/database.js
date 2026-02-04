import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', '..', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    // No terminar el proceso, intentar reconectar
    setTimeout(() => {
      console.log('🔄 Intentando reconectar a la base de datos...');
      db.run('SELECT 1', (err) => {
        if (err) {
          console.error('❌ Error de reconexión:', err);
        } else {
          console.log('✅ Base de datos reconectada');
        }
      });
    }, 5000);
  } else {
    console.log('✅ SQLite database connected');
  }
});

// Manejar errores de base de datos
db.on('error', (err) => {
  console.error('❌ Error de base de datos:', err);
});

db.configure('busyTimeout', 30000); // Timeout de 30 segundos para transacciones

// Promisify database operations
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize database schema
export const initDB = async () => {
  try {
    // Tabla de autenticación segura
    await dbRun(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        failedAttempts INTEGER DEFAULT 0,
        lockedUntil TEXT,
        lastLogin DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        robloxId INTEGER UNIQUE NOT NULL,
        username TEXT NOT NULL,
        displayName TEXT,
        avatarUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API Keys table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        key TEXT UNIQUE NOT NULL,
        active BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastUsed DATETIME,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Generated systems table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS generated_systems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        systemType TEXT NOT NULL,
        generatedCode TEXT,
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
};

export default db;
