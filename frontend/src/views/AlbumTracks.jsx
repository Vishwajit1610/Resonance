import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import usePlayerStore from '../store/usePlayerStore';

export default function AlbumTracks() {
  const { id } = useParams(); // Grabs the Album ID from the URL
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // The Daemon Connection
  const playTrack = usePlayerStore((state) => state.playTrack);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  useEffect(() => {
    fetch(`http://localhost:3000/api/albums/${id}/tracks`)
      .then(res => res.json())
      .then(data => {
        const tracksWithAlbumId = data.map(track => ({ ...track, album_id: id }));
        setTracks(tracksWithAlbumId);
        setIsLoading(false);
      })
      .catch(err => console.error("Failed to fetch tracks:", err));
  }, [id]); 

  if (isLoading) return <h1 className="p-8 text-2xl text-tx-muted">Loading tracks...</h1>;

  return (
    <div className="p-8 w-full">
      <h1 className="text-4xl font-bold mb-8 text-tx-main tracking-tight">Album Tracks</h1>

      <div className="flex flex-col gap-2">
        {tracks.map((track) => {
          // Check if this specific row is the one currently loaded in memory
          const isThisTrackPlaying = currentTrack?.id === track.id;

          return (
            <div 
              key={track.id}
              onClick={() => playTrack(track)} // THE IGNITION
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition ${
                isThisTrackPlaying 
                  ? 'bg-surface-hover border border-primary/30' 
                  : 'hover:bg-surface border border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-tx-muted font-mono w-6 text-right">
                  {isThisTrackPlaying && isPlaying ? '▶' : track.track_number}
                </span>
                <span className={`font-semibold ${isThisTrackPlaying ? 'text-primary' : 'text-tx-main'}`}>
                  {track.title}
                </span>
              </div>

              {/* Render the extracted artists strings safely */}
              <div className="text-sm text-tx-muted">
                {track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
