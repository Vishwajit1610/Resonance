// This is the persistent control deck glued to the bottom. It connects directly to the Zustand daemon to display the truth.

import usePlayerStore from '../../store/usePlayerStore';

// Math Helper: Converts seconds to 3:45 format
const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return "0:00";
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function PlayerBar() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  
  // Pull Timeline State
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);

  return (
    <div className="h-24 bg-surface border-t border-border flex items-center justify-between px-8">
      
      {/* Left: Track Info & Album Art */}
      <div className="w-1/3 flex items-center gap-4">
        <div className="w-14 h-14 bg-surface-hover rounded shrink-0 overflow-hidden shadow-md">
          {currentTrack && currentTrack.album_id && (
            <img 
              // Hit the on-the-fly extraction endpoint
              src={`http://localhost:3000/api/art/${currentTrack.album_id}`} 
              alt="Cover" 
              className="w-full h-full object-cover"
              // Fallback if the FLAC has no embedded image
              onError={(e) => e.target.style.display = 'none'} 
            />
          )}
        </div>
        
        {currentTrack ? (
          <div className="truncate">
            <h4 className="text-tx-main font-bold truncate">{currentTrack.title}</h4>
            <p className="text-sm text-tx-muted truncate">
              {currentTrack.artists ? currentTrack.artists.map(a => a.name).join(', ') : 'Unknown Artist'}
            </p>
          </div>
        ) : (
          <p className="text-tx-muted font-medium">No track selected</p>
        )}
      </div>

      {/* Center: Controls & Interactive Timeline */}
      <div className="flex flex-col items-center justify-center w-1/3 gap-2">
        <div className="flex items-center gap-6">
          <button className="text-tx-muted hover:text-tx-main transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button 
            onClick={togglePlay}
            disabled={!currentTrack}
            className="bg-tx-main text-background rounded-full p-2 hover:scale-105 disabled:opacity-50 transition"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button className="text-tx-muted hover:text-tx-main transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        {/* The Native Scrubbing Slider */}
        <div className="w-full flex items-center gap-3 text-xs text-tx-muted font-mono">
          <span className="w-8 text-right">{formatTime(currentTime)}</span>
          <input 
            type="range" 
            min={0} 
            max={duration || 100} 
            value={currentTime || 0}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="flex-1 h-1 bg-surface-hover rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume */}
      <div className="w-1/3 flex justify-end">
        <div className="w-32 h-1 bg-surface-hover rounded-full"></div>
      </div>
    </div>
  );
}
