# Architecture

## System Overview

```
FLAC files on disk
        │
        ▼
sync-database.js          ← DFS scanner + music-metadata parser
        │
        ▼
resonance.db (SQLite)     ← normalized metadata index
        │
        ▼
server.js (Express 5)
  ├── /api/stream/:id     ← byte-range audio delivery
  ├── /api/art/:id        ← on-the-fly artwork extraction
  ├── /api/search         ← tokenized search
  └── /api/...            ← library + dashboard endpoints
        │
        ▼
React + Zustand
  ├── usePlayerStore      ← global playback state
  ├── <audio> ref         ← imperative playback control
  └── MediaSession API    ← OS hardware key binding
```

---

## Core Components

| Component        | File                                 | Responsibility                                         |
| ---------------- | ------------------------------------ | ------------------------------------------------------ |
| Ingestion engine | `sync-database.js`, `scanner.js` | DFS walk → metadata parse → SQLite insert            |
| SQLite index     | `database.js`                      | Normalized schema; metadata only, no audio             |
| Express API      | `server.js`                        | Streaming, artwork extraction, search, library queries |
| React frontend   | `src/views/`, `src/components/`  | UI, routing, playback controls                         |
| Zustand store    | `usePlayerStore.js`                | Single source of truth for all playback state          |

---

## Database Design

```sql
artists      (id, name)
albums       (id, title, barcode, primary_artist_id → artists)
tracks       (id, title, track_number, file_path, isrc, album_id → albums)
track_artists(track_id → tracks, artist_id → artists, role)
```

`track_artists` is a junction table resolving the many-to-many relationship between tracks and artists. A single artist column on tracks cannot model collaborative releases or special artist names. Storing "The Weeknd & Daft Punk" as a string prevents independent artist queries, while names such as "Tyler, The Creator" demonstrate why naïve comma-based parsing can corrupt metadata. The junction table stores each contributor as a discrete row with a role field (primary, feature), enabling clean per-artist queries.

`albums.primary_artist_id` is a direct foreign key for efficient album-grid queries that don't require joining through `track_artists`.

SQLite foreign key enforcement is off by default and enabled explicitly: `PRAGMA foreign_keys = ON`.

---

## Streaming Pipeline

`GET /api/stream/:id` reads the `Range` header sent by the browser's `<audio>` element and responds with HTTP **206 Partial Content**:

The browser requests byte ranges through the HTTP Range header.

Express streams only the requested portion of the FLAC file from disk using Node streams and responds with HTTP 206 Partial Content.


`fs.createReadStream` reads only the requested byte slice. Therefore, no full-file load into memory. Enables seek-to-position without buffering the entire file.

Artwork (`GET /api/art/:id`) follows the same pattern: `music-metadata` reads only the FLAC picture block from one track per album, sends the raw buffer directly to the socket. No images are pre-extracted to disk.

---

## Search Architecture

Input is debounced (300ms) client-side via a custom `useDebounce` hook before any network request is made.

Input is tokenized into independent search terms. Each token must match either the track title or artist name, allowing multi-word queries such as "Bully Kanye" to match across both fields.

All tokens must match; order is irrelevant. Results are capped at `LIMIT 15` (tracks) and `LIMIT 10` (albums) at the SQL level to prevent large result sets from serializing into the response. Both queries run in parallel via `Promise.all`.

`LIKE '%token%'` performs a full table scan. This is a deliberate tradeoff because at local library scale (<50k records), execution time is negligible and avoids the schema complexity of SQLite FTS5.

---

## Key Engineering Decisions

- **Filesystem is source of truth.** SQLite stores `file_path` strings, not audio. Database can be deleted and rebuilt from disk at any time.
- **FLAC-only ingestion.** Vorbis Comment metadata is strictly standardized. Lossy formats have inconsistent tagging that would require fallback heuristics.
- **Global playback state in Zustand, not React tree.** `PlayerBar`, `Sidebar`, and `MainViewport` are layout siblings — no common ancestor suitable for prop drilling. Zustand subscriptions update only components that read changed slices.
- **Seek via command pattern.** `seekCommand` in the store is consumed by a `useEffect` in `App.jsx` that applies `audioRef.current.currentTime = value` imperatively. Keeps DOM mutations sequenced through one effect, not spread across the component tree.
- **Doubly Linked List queue built at fetch time.** Track objects carry `prev`/`next` pointers assembled when an album loads. `playNext` follows the pointer — no index math, no queue array in the store.
- **No image caching.** Artwork is extracted per request. Acceptable for single-user local use; a caching layer would be the first addition under any multi-user load.

---

## Future Work

- Playlist creation and management
- Vite proxy configuration to remove hardcoded `localhost:3000` URLs
- Tauri packaging for native desktop distribution
- Mobile-responsive layout
