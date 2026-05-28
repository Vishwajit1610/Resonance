import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();

const dbPath = path.resolve(import.meta.dirname, 'resonance.db');

// Open the connection.
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening Database connection', err.message);
  } else {
    console.log('Connected to the SQLite3 Database.');
    
    // Enable Foreign Key constraints (SQLite disables them by default)
    db.run('PRAGMA foreign_keys = ON;'); 
    initializeTables();
  }
});

// Define the tables.
function initializeTables() {

  const createArtistsTable = `
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `;

  const createAlbumsTable = `
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      barcode TEXT,
      artist_id INTEGER,
      FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
    );
  `;

  const createTracksTable = `
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      track_number INTEGER,
      file_path TEXT UNIQUE NOT NULL,
      isrc TEXT,
      album_id INTEGER,
      FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE CASCADE
    );
  `;

  db.serialize(() => {
    db.run(createArtistsTable);
    db.run(createAlbumsTable);
    db.run(createTracksTable, (err) => {
      if (err) {
        console.error('Error creating tables: ', err.message);
      } else {
        console.log('Database Tables created successfully.');
      }
    });
  });
}

export default db
