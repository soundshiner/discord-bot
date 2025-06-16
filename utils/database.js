// utils/database.js
import Database from "better-sqlite3";
const db = new Database("suggestions.sqlite");

// Create table if not exists
db.prepare(
  `CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    titre TEXT NOT NULL,
    artiste TEXT NOT NULL,
    lien TEXT,
    genre TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`
).run();

export { db };
