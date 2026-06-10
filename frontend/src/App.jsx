import { useRef, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import usePlayerStore from './store/usePlayerStore';

// Layout Imports
import Sidebar from './components/layout/Sidebar';
import PlayerBar from './components/layout/PlayerBar';
import MainViewport from './components/layout/MainViewport';

function App() {
  const audioRef = useRef(null);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);

  // Pull Timeline Mutators
  const updateProgress = usePlayerStore((state) => state.updateProgress);
  const seekCommand = usePlayerStore((state) => state.seekCommand);
  const clearSeekCommand = usePlayerStore((state) => state.clearSeekCommand);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrev = usePlayerStore((state) => state.playPrev);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  // 1. The Play/Pause Sync
  useEffect(() => {
    if (!audioRef.current) return;
    if (currentTrack) {
      const streamUrl = `http://localhost:3000/api/stream/${currentTrack.id}`;
      if (audioRef.current.src !== streamUrl) {
        audioRef.current.src = streamUrl;
      }
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback blocked:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrack, isPlaying]);

  // 2. The Seek Execution
  useEffect(() => {
    if (seekCommand !== null && audioRef.current) {
      audioRef.current.currentTime = seekCommand; // Physically move the C++ audio pointer
      clearSeekCommand(); // Reset the command
    }
  }, [seekCommand, clearSeekCommand]);

  // 3. The Hardware Volume Sync
  useEffect(() => {
    // Guard clause: Ensure the physical HTML audio tag is mounted in the DOM
    if (audioRef.current) {
      audioRef.current.volume = volume; // Maps float (0.0 to 1.0)
      audioRef.current.muted = isMuted; // Maps Boolean (true/false) 
    }
  }, [volume, isMuted]);

  // 4. OS-level Hardware Media Keys (MPRIS / Media Session API) 
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      // Tell the OS what is playing so Hyprland/Waybar can display it
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title : currentTrack.title,
        artist : currentTrack.artists ? currentTrack.artists.map(a => a.name).join(', ') : 'Unknown Artist',
        album : 'Resonance',
        artwork: [
          { src: `http://localhost:3000/api/art/${currentTrack.album_id}`, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    
      // Bind the physical hardware keys to Zustand Daemon
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    }   
  }, [currentTrack, setIsPlaying, playNext, playPrev]);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        <audio 
          ref={audioRef} 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          // NEW: Report physical time back to the UI daemon
          onTimeUpdate={(e) => updateProgress(e.target.currentTime, e.target.duration || 0)}
          onEnded={playNext} // Automatic Progression to the next track.
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MainViewport />
        </div>
        <PlayerBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
