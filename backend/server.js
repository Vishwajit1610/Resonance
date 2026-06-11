import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db  from './database.js';
import fs from 'fs';
import { parseFile } from 'music-metadata';

const app = express();
const PORT = process.env.PORT || 3000;

/* ---- MIDDLEWARE ---- */

app.use(cors());
app.use(express.json());

// Promise Wrapper for SQLite, needed for fetching the track. Returns single row.
const dbGet = (query, params) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
});

// Promise Wrapper for SQLite, needed for fetching all the info such as artists, albums, tracks. Returns multiple rows.
const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
});

// THE CORE STREAMING ENGINE
app.get('/api/stream/:id', async (req, res) => {
  try {
    const trackId = req.params.id;

    // 1. Fetch the file path from SQLite
    const track = await dbGet('SELECT file_path FROM tracks WHERE id = ?', [trackId]);

    // Failure Mode: IF track doesn't exists in Database
    if (!track) {
      return res.status(404).json({ error: 'Track NOT found in Database.'  });
    }

    const filePath = track.file_path;

    // Failure Mode: IF track file was deleted from the hard drive but is present in the Database
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file is missing from disk.' });
    }

    // 2. Get the physical file size from OS
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // 3. Check for the Range Header
    const range = req.headers.range;

    if (range) {
      // The browser asked for a specific chunk (e.g., "bytes=32768-")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      
      // If the browser didn't specify an end byte, just send a 1MB chunk max 
      // to prevent memory spikes, or send to the end of the file. 
      // We'll calculate up to the end of the file for simplicity, Node streams handle it well.
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      // Open the file descriptor for this exact byte range
      const fileStream = fs.createReadStream(filePath, { start, end });

      // Set the 206 Partial Content headers
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/flac',

      };
      res.writeHead(206, headers);

      // Pipe the disk stream directly to the network socket
      fileStream.pipe(res);

    } else {
      // Failure Mode: Client didn't ask for a range.
      // Just send the whole file with a 200 OK status.
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/flac',
      };
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);

    } 
  } catch (error) {
      console.log("Streaming error: ", error);
      res.status(500).json({ error: "Internal Server Error during Streaming..." });
  }
});

// Library REST endpoints
app.get('/api/artists', async (req, res) => {
  try {
    // 1. Define the SQL query. which returns the json sorted alphabetically.
    const query = 'SELECT id, name FROM artists ORDER BY name ASC';

    // 2. Execute the query with second Promise Wrapper for SQLite.
    const artists = await dbAll(query);

    // 3. Send the data back to the client as JSON with a status code 200.
    res.status(200).json(artists);
  } 
  catch(error) {
    console.error("Error fetching artists: ", error);
    res.status(500).json({ error: 'Failed to fetch artists from database.' });
  }
});

app.get('/api/artists/:id/albums', async (req, res) => {
  try {
    // 1. Extract the artist ID from the URL parameters.
    const artistId = req.params.id;

    // 2. Define the SQL query.
    const query = 'SELECT id, title FROM albums WHERE primary_artist_id = ?';

    // 3. Execute the query using the dbAll wrapper and the artistId array.
    const albums = await dbAll(query, [artistId]);

    // 4. Send the data back to the client as JSON with a status code 200.
    res.status(200).json(albums);
  }
  catch(error) {
    console.error(`Error fetching albums for artist ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch album" });
  }
});

app.get('/api/albums/:id/tracks', async (req, res) => {
  try {
    // 1. Extract the albums ID from the URL parameters.
    const albumId = req.params.id;

    // 2. Define the SQL query.
    // Join the track_artists table and group the artists into a single string.
    // We use '::' to separate names from roles and '||' to separate different artists.
    const query = `
      SELECT t.id, t.title, t.track_number,
            GROUP_CONCAT(a.name || '::' || ta.role, '||') AS contributors
      FROM tracks t
      JOIN track_artists ta ON t.id = ta.track_id
      JOIN artists a ON ta.artist_id = a.id
      WHERE t.album_id = ?
      GROUP BY t.id
      ORDER BY t.track_number ASC
    `;

    // 3. Execute the query using the dbAll wrapper and the albumId array.
    const rawTracks = await dbAll(query, [albumId]);

    // Parse the SQLite sting back into a clean JavaScript array for React.
    const tracks = rawTracks.map(track => {
      let parsedArtists = [];
      if (track.contributors) {
        parsedArtists = track.contributors.split('||').map(contributors => {
          const [name, role] = contributors.split('::');
          return {name, role};
        });
      }

      return {
        id: track.id,
        title: track.title,
        track_number: track.track_number,
        artists: parsedArtists
      };
    });

    // 4. Send the data back to the client as JSON with a status code 200.
    res.status(200).json(tracks);

  }
  catch(error) {
    console.error(`Error fetching tracks for album ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

// Route for Albums, which we later fetch for Album view in Frontend
app.get('/api/albums', async (req, res) => {
  try {
    const albums = await dbAll(`
      SELECT
        a.id,
        a.title,
        artists.name AS artists
      FROM albums a
      LEFT JOIN artists ON a.primary_artist_id = artists.id
      ORDER BY a.title ASC
    `);

    res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({
      error: 'Failed to fetch albums'
    });
  }
});

// On-The-Fly Album Extractor
app.get('/api/art/:id', async (req, res) => {
  try {
    const albumId = req.params.id;

    // 1. The Heuristic: We only need to ONE track from the album to get the cover art.
    // LIMIT 1 is a critical optimization so we don't end up scanning the whole directory.
    const track = await dbGet('SELECT file_path FROM tracks WHERE album_id = ? LIMIT 1', [albumId]);

    // Failure Mode 1: The album exists, but has no tracks (Orphan Database Record).
    if (!track) {
      return res.status(404).json({ error: "No tracks found for this album." });
    }

    const filePath = track.file_path;

    // Failure Mode 2: The file was physical moved/deleted from the hard drive.
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Audio file missing from drive." });
    }

    // 2. The Extraction: We ask music-metadata to read the header.
    // By default, this DOES NOT read massive audio blocks, and only reads the metadata tags, keeping RAM usage low.
    const meta = await parseFile(filePath);
    const picture = meta.common.picture;

    // Failure Mode 3: The FLAC file is completely, but whoever ripped it (legally) forgot to embed the cover image.
    if (!picture || picture.length === 0) {
      // Returns a 404 here. Later on, we will program the React Frontend to catch this 404 and display a gray "Default Music Note" SVG placeholder.
      return res.status(404).json({ error: "No embedded art found in the audio file." });
    }

    // 3. The Network Handshake: Grab the first embedded picture (usually the front cover).
    const coverArt = picture[0];

    // We explicitally tell the browser what exact binary format is coming over the wire (e.g., 'image/jpeg', 'image/png')
    res.set('Content-Type', coverArt.format);

    // We send the raw Node.js buffer directly to the Network Socket, which Express is smart enough to handle the binary stream.
    res.send(coverArt.data);
  }
  catch (error){
    console.error(`Failed to extract art for album ${req.params.id}: `, error);
    res.status(500).json({ error: "Internal Server Error during Album Art Extraction" });
  }
});

// --- Dashboard endpoints ---
// Helper function to enforce the standard Track interface
const normalizeTrackPayload = (rawTracks) => {
  return rawTracks.map(track => {
    let parsedArtists = [];
    if (track.contributors) {
      parsedArtists = track.contributors.split('||').map(c => {
        const [name, role] = c.split('::');
        return { name, role };
      });
    }
    return {
      id: track.id,
      title: track.title,
      album_id: track.album_id,
      artists: parsedArtists // The PlayerBar expects this array
    };
  });
};

// Row 1 - Fresh ingested tracks (last 20 tracks added to the database)
app.get('/api/dashboard/recent', async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.title, t.album_id, 
             GROUP_CONCAT(a.name || '::' || ta.role, '||') AS contributors
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      GROUP BY t.id
      ORDER BY t.id DESC
      LIMIT 20
    `;
    
    const rawTracks = await dbAll(query);
    res.status(200).json(normalizeTrackPayload(rawTracks));
  } catch(error) {
    console.error('Error fetching recent:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

// Row 2 - Rediscovery (20 random tracks)
app.get('/api/dashboard/discover', async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.title, t.album_id, 
             GROUP_CONCAT(a.name || '::' || ta.role, '||') AS contributors
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      GROUP BY t.id
      ORDER BY RANDOM()
      LIMIT 20
    `;
    const rawTracks = await dbAll(query);
    res.status(200).json(normalizeTrackPayload(rawTracks));
  } catch(error) {
    console.error('Error fetching discover:', error);
    res.status(500).json({ error: 'Failed to fetch discover tracks' });
  }
});

// --- Search Engine Endpoint ---
app.get('/api/search', async (req, res) => {
  // 1. Input checking & Whitespace Guard
  const q = (req.query.q || '').trim();

  if (!q) {
    return res.status(200).json({ tracks: [], albums: [] });
  }

  try {
    // 2. Tokenization: Split the query by spaces and remove empty strings
    const tokens = q.split(/\s+/).filter(Boolean);

    // 3. Dynamic SQL Construction for Tracks
    const trackConditions = tokens.map(() => '(t.title LIKE ? OR a.name LIKE ?)').join(' AND ');
    
    // need to supply the token twice for each condition block
    const trackParams = [];
    tokens.forEach(token => {
      trackParams.push(`%${token}%`, `%${token}%`);
    });

    const trackQuery = `
      SELECT t.id, t.title, t.album_id, 
        GROUP_CONCAT(a.name || '::' || ta.role, '||') AS contributors
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      WHERE ${trackConditions}
      GROUP BY t.id
      LIMIT 15
    `;
    
    // 4. Dynamic SQL Construction for Albums
    // Check both the Album Title and the Primary Artist Name
    const albumConditions = tokens.map(() => '(al.title LIKE ? OR a.name LIKE ?)').join(' AND ');
    
    // Because we check two columns (title OR name), we must push the token twice per condition
    const albumParams = [];
    tokens.forEach(token => {
      albumParams.push(`%${token}%`, `%${token}%`);
    });

    const albumQuery = `
      SELECT al.id, al.title 
      FROM albums al
      LEFT JOIN artists a ON al.primary_artist_id = a.id
      WHERE ${albumConditions}
      GROUP BY al.id
      LIMIT 10
    `;

    // 5. Parallel Disk I/O (Pass dynamic arrays)
    const [rawTracks, albums] = await Promise.all([
      dbAll(trackQuery, trackParams),
      dbAll(albumQuery, albumParams)
    ]);
    
    // 6. Normalization Pipeline 
    const tracks = normalizeTrackPayload(rawTracks);

    res.status(200).json({ tracks, albums });
  }  catch (error) {
    console.error('Search Engine Error: ', error);
    res.status(500).json({ error: 'Search Pipeline Failed' });
  }
});

/* ---- ROUTES ---- */

// Simple health-check endpoint to verify the server is alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'Resonance API is Running...' });
});


/* ---- BOOT Sequence ---- */

app.listen(PORT, () => {
  console.log(`Resonance Server is listening on http://localhost:${PORT}`);
});
