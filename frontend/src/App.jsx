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

  // Pull Timeline Mutators
  const updateProgress = usePlayerStore((state) => state.updateProgress);
  const seekCommand = usePlayerStore((state) => state.seekCommand);
  const clearSeekCommand = usePlayerStore((state) => state.clearSeekCommand);
  const playNext = usePlayerStore((state) => state.playNext);

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

  // 2. NEW: The Seek Execution
  useEffect(() => {
    if (seekCommand !== null && audioRef.current) {
      audioRef.current.currentTime = seekCommand; // Physically move the C++ audio pointer
      clearSeekCommand(); // Reset the command
    }
  }, [seekCommand, clearSeekCommand]);

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
