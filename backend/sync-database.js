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
    const trackTitle = meta.common.title || 'Unknown Track';
    const albumTitle = meta.common.album || 'Unknown Album';
    const trackNumber = meta.common.track.no || 0;
    // The specific identifiers
    const barcode = meta.common.barcode || null;
    const isrc = meta.common.isrc || null;

    // --- Album Owner ---
    let customMainArtist = null;
    if (meta.native && meta.native.vorbis) {
      // Some systems use 'id' some use 'key' depending on the tagger.
      const mainArtistTag = meta.native.vorbis.find(tag => 
        (tag.id && tag.id.toLowerCase() === 'main_artist') ||
        (tag.key && tag.key.toLowerCase() === 'main_artist')
      );
      if (mainArtistTag) customMainArtist = mainArtistTag.value;
    }
    const primaryArtistName = meta.common.albumartist || customMainArtist || meta.common.artist || 'Unknown Artist';

    // --- Tracks PERFORMERS Array ---
    let performers = [];

    // Try to grab ALL distinct 'main_artist' tags from the raw Vorbis data
    if (meta.native && meta.native.vorbis) {
      const distinctArtists = meta.native.vorbis
        .filter(tag => (tag.id && tag.id.toLowerCase() === 'main_artist') || (tag.key && tag.key.toLowerCase() === 'main_artist'))
        .map(tag => tag.value);

      if (distinctArtists.length > 0) {
        performers = distinctArtists;
      }
    }

    // If the file doesn't have perfectly separated custom tags, fallback safely
    if (performers.length === 0) {
      if (meta.common.artists && meta.common.artists.length > 0) {
        performers = meta.common.artists;
      } else {
        performers = [meta.common.artist || primaryArtistName];
      }
    }

    // 2. Resolve Album owner in DB
    let owner = await dbGet('SELECT id FROM artists WHERE name = ?', [primaryArtistName]);
    let ownerId;
    if (!owner) {
      ownerId = await dbRun('INSERT INTO artists (name) VALUES (?)', [primaryArtistName]);
    } else {
      ownerId = owner.id;
    }

    // 3. Album Logic
    let albumId;
    if (barcode) {
      // Barcode matching
      let album = await dbGet('SELECT id FROM albums WHERE barcode = ?', [barcode]);
      if (!album) {
        albumId = await dbRun('INSERT INTO albums (title, barcode, primary_artist_id) VALUES (?, ?, ?)', [albumTitle, barcode, ownerId]); 
      } else {
        albumId = album.id;
      }
    } else {
      // Fallback (Title + Resolved Artist)
      // Since we've set up `artistName = albumArtist || trackArtist` above, 
      // artistId already perfectly represents either albumArtist or trackArtist.
      let album = await dbGet('SELECT id FROM albums WHERE title = ? AND primary_artist_id = ?', [albumTitle, ownerId]);
      if (!album) {
        // Album doesn't exist, so insert it.
        albumId = await dbRun('INSERT INTO albums (title, primary_artist_id) VALUES (?, ?)', [albumTitle, ownerId]);
      } else {
        // Album exists, so grab it's ID.
        albumId = album.id;
      } 
    }
    
    // 4. Tracks Logic
    // ISRC as the identifier.
    let track = await dbGet('SELECT id FROM tracks WHERE file_path = ?', [filePath]);
    let trackId;
    if (!track) {
      // Track doesn't exists, so insert it.
      trackId = await dbRun(
        'INSERT INTO tracks (title, track_number, file_path, isrc, album_id) VALUES (?, ?, ?, ?, ?)',
        [trackTitle, trackNumber, filePath, isrc, albumId]
      );
    } else {
      // Track exists, so grab it's ID.
      trackId = track.id;
    }

    // track_artists table loop (wiring up the featured artists)
    for (let i = 0; i < performers.length; i++) {
      const perfName = performers[i];

      let perfRecord = await dbGet('SELECT id FROM artists WHERE name = ?', [perfName]);
      let perfId;
      if (!perfRecord) {
        perfId = await dbRun('INSERT INTO artists (name) VALUES (?)', [perfName]);
      } else {
        perfId = perfRecord.id;
      }

      const role = (i === 0) ? 'primary' : 'feature';

      await dbRun(
        'INSERT OR IGNORE INTO track_artists (track_id, artist_id, role) VALUES (?, ?, ?)',
        [trackId, perfId, role]
      );
    }

    console.log(`Ingested: ${trackTitle} by ${primaryArtistName} (Barcode: ${barcode ? 'YES' : 'NO' })`);
  
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error);
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
