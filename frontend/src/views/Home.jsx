import { useEffect } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import ScrollRow from '../components/ui/ScrollRow';
import TrackCard from '../components/ui/TrackCard';

export default function Home() {
  // Pulling Arrays and Mutators from the Zustand Daemon
  const {
    recentTracks,
    discoverTracks,
    fetchRecentTracks,
    refreshDiscoverTracks,
    playTrack
  } = usePlayerStore();

  useEffect(() => {
    fetchRecentTracks();
    refreshDiscoverTracks();
  }, [fetchRecentTracks, refreshDiscoverTracks]);

  return (
    <div className="p-8 w-full text-tx-main flex flex-col gap-12">
      
      {/* --- ROW 1: RECENTLY ADDED --- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Fresh Ingest</h2>
        
        <ScrollRow>
          {recentTracks.map((track) => (
            <TrackCard 
              key={track.id} 
              track={track} 
              onClick={() => playTrack(track)} 
            />
          ))}
        </ScrollRow>      
      </section>

      {/* --- ROW 2: DISCOVER --- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-end mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Rediscovery</h2>
          {/* The Volatile Override Button */}
          <button 
            onClick={() => refreshDiscoverTracks(true)}
            className="text-sm font-medium text-tx-muted hover:text-tx-main transition-colors px-3 py-1 bg-surface-hover rounded-md"
          >
            Reshuffle
          </button>
        </div>
        <ScrollRow>
            {discoverTracks.map((track) => (
              <TrackCard 
                key={track.id} 
                track={track} 
                onClick={() => playTrack(track)} 
              />
            ))}
          </ScrollRow>
      </section>
    </div>
  );
}
