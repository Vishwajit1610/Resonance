import { useEffect } from 'react';
import usePlayerStore from '../store/usePlayerStore';

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
        
        {/* The CSS Firewall Container: Forces horizontal scroll, blocks vertical wrap */}
        <div className="flex flex-row flex-nowrap overflow-x-auto gap-6 pb-4 snap-x">
          
          {recentTracks.map((track) => (
            <div 
              key={track.id} 
              onClick={() => playTrack(track)} // THE AUDIO ENGINE TRIGGER
              className="min-w-[160px] max-w-[160px] snap-start group cursor-pointer flex flex-col gap-2"
            >
              {/* The Immutable Square Boundary */}
              <div className="w-full aspect-square bg-surface-hover rounded-md overflow-hidden shadow-md">
                <img 
                  src={`http://localhost:3000/api/art/${track.album_id}`} 
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              {/* The Metadata Block */}
              <div className="flex flex-col">
                <h3 className="text-tx-main font-bold text-sm truncate">{track.title}</h3>
                
                {/* Map the array back into a readable string for the card UI */}
                <p className="text-xs text-tx-muted truncate">
                  {track.artists?.length > 0 
                    ? track.artists.map(a => a.name).join(', ') 
                    : 'Unknown Artist'}
                </p>
              </div>
            </div>
          ))}

        </div>
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
        
        {/* The CSS Firewall Container */}
        <div className="flex flex-row flex-nowrap overflow-x-auto gap-6 pb-4 snap-x">
          
          {discoverTracks.map((track) => (
            <div 
              key={track.id} 
              onClick={() => playTrack(track)} // THE AUDIO ENGINE TRIGGER
              className="min-w-[160px] max-w-[160px] snap-start group cursor-pointer flex flex-col gap-2"
            >
              {/* The Immutable Square Boundary */}
              <div className="w-full aspect-square bg-surface-hover rounded-md overflow-hidden shadow-md">
                <img 
                  src={`http://localhost:3000/api/art/${track.album_id}`} 
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              {/* The Metadata Block */}
              <div className="flex flex-col">
                <h3 className="text-tx-main font-bold text-sm truncate">{track.title}</h3>
                
                {/* Map the array back into a readable string for the card UI */}
                <p className="text-xs text-tx-muted truncate">
                  {track.artists?.length > 0 
                    ? track.artists.map(a => a.name).join(', ') 
                    : 'Unknown Artist'}
                </p>
              </div>            
            </div>
          ))}

        </div>
      </section>
    </div>
  );
}
