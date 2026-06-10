// Persistent playback controls.
// Reads player state and dispatches playback actions through Zustand.

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
  const playPrev = usePlayerStore((state) => state.playPrev);
  const playNext = usePlayerStore((state) => state.playNext);
  
  // Pull Timeline State
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);

  // Pull Audio State
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const toggleMute = usePlayerStore((state) => state.toggleMute);

  // Calculate the exact completion percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

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
          <button 
            onClick={playPrev} 
            disabled={!currentTrack?.prev}
            className="text-tx-muted hover:text-tx-main transition">
            {/* Previous Icon */}
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

          <button 
            onClick={playNext} 
            disabled={!currentTrack?.next}
            className="text-tx-muted hover:text-tx-main transition">
            {/* Next Icon */}
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
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, var(--brand-primary) ${progressPercentage}%, var(--bg-surface-hover) ${progressPercentage}%)`
            }}
          />
          <span className="w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume */}
      <div className="w-1/3 flex justify-end items-center gap-2">
        <button onClick={toggleMute} className="text-tx-muted hover:text-tx-main transition">
          {isMuted || volume === 0 ? (
            /* Muted / Zero Volume Icon */
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          ) : (
            /* Speaker Icon */
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          )}
        </button>

        <input 
          type="range"
          min={0}
          max={100}
          // PATCHED: Changed 'volume' to 'value'
          value={volume * 100}
          onChange={(e) => {
            const rawSliderValue = Number(e.target.value);
            setVolume(rawSliderValue / 100);
          }}
          className="w-24 h-1 rounded-full appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, var(--brand-primary) ${volume * 100}%, var(--bg-surface-hover) ${volume * 100}%)`
          }}
        />
      </div>    
    </div>
  );
}
