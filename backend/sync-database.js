import 'dotenv/config';
import db from './database.js';
import { parseFile } from 'music-metadata';
import findFlacFiles from './scanner.js';

// --- Promise Wrapper for SQLite ---
const dbGet = (query, params) => new Promise ((resolve, reject) => {
  db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (query, params) => new Promise ((resolve, reject) => {
  db.run(query, params, function(err) {
    err ? reject(err) : resolve(this.lastID); // this.lastId is the newly inserted row.
  });
});

async function processFile(filePath) {
  try {
    // 1. Extraction
    const meta = await parseFile(filePath);

    // Fallback: If a file has missing data, don't crash, use 'Unknown'
    const artistName = meta.common.artist || 'Unknown Artist';
    const albumTitle = meta.common.album || 'Unknown Album';
    const trackTitle = meta.common.title || 'Unknown Track';
    const trackNumber = meta.common.track.no || 0;

    // 2. Artist Logic
    let artist = await dbGet('SELECT id FROM artists WHERE name = ?', [artistName]);
    let artistId;
    if (!artist) {
      // Artist doesn't exist, so insert them.
      artistId = await dbRun('INSERT INTO artists (name) VALUES (?)', [artistName]);
    } else {
      // Artist exists, so grab their ID.
      artistId = artist.id;
    }

    // 3. Album Logic
    let album = await dbGet('SELECT id FROM albums WHERE title = ? AND artist_id = ?', [albumTitle, artistId]);
    let albumId;
    if (!album) {
      // Album doesn't exist, so insert it.
      albumId = await dbRun('INSERT INTO albums (title, artist_id) VALUES (?, ?)', [albumTitle, artistId]);
    } else {
      // Album exists, so grab it's ID.
      albumId = album.id;
    }

    // 4. Tracks Logic
    let track = await dbGet('SELECT id FROM tracks WHERE file_path = ?', [filePath]);
    let trackId;
    if (!track) {
      // Track doesn't exists, so insert it.
      trackId = await dbRun('INSERT INTO tracks (title, track_number, file_path, album_id) VALUES (?, ?, ?, ?)', [trackTitle, trackNumber, filePath, albumId]);
    } else {
      // Track exists, so grab it's ID.
      trackId = track.id;
    }

    console.log(`Ingested: ${trackTitle} by ${artistName}`);
  
  } catch (error) {
    console.error(`Failed to process ${filePath}`);
  }
}

async function runSync() {
  console.log("Scanning filesystem...");

  const musicFolder = process.env.MUSIC_DIRECTORY;

  if (!musicFolder) {
    console.log('CRITICAL ERROR: MUSIC_DIRECTORY is not set in your .env file.');
    process.exit(1);
  }

  const files = await findFlacFiles(musicFolder);

  console.log(`Found ${files.length} files. Starting Ingestion...`);

  // Process one file at a time to prevent DB locks
  for (const file of files) {
    await processFile(file);
  }

  console.log("Sync Complete!");
}

// Execute the Sync
runSync();
