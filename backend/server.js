import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db  from './database.js';
import fs from 'fs';

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

      res.writeHead(200, headers);

      // Pipe the disk stream directly to the network socket
      fileStream.pipe(res);

    } else {
      // Failure Mode: Client didn't ask for a range.
      // Just send the whole file with a 200 OK status.
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/flac',
      };
      res.writeHead(206, headers);
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
    const query = 'SELECT id, title FROM albums WHERE artist_id = ?';

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
    const query = 'SELECT id, title, track_number FROM tracks WHERE album_id = ? ORDER BY track_number ASC';

    // 3. Execute the query using the dbAll wrapper and the albumId array.
    const tracks = await dbAll(query, [albumId]);

    // 4. Send the data back to the client as JSON with a status code 200.
    res.status(200).json(tracks);
  }
  catch(error) {
    console.error(`Error fetching tracks for album ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch tracks" });
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
