import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/usePlayerStore';
import useDebounce from '../hooks/useDebounce';

import ScrollRow from '../components/ui/ScrollRow';
import TrackCard from '../components/ui/TrackCard';
import AlbumCard from '../components/ui/AlbumCard';

export default function Search() {
  // 1. The RAM (State Matrix)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tracks: [], albums: [] });

  // 2. The Interaction Engines
  const navigate = useNavigate();
  const playTrack = usePlayerStore(state => state.playTrack);

  // 3. The Temporal Firewall (300ms delay)
  const debouncedQuery = useDebounce(query, 300);

  const [isSearching, setIsSearching] = useState(false);

  // 4. The Network Pipeline
  useEffect(() => {
    // The Whitespace Guard & State Invalidator
    if (!debouncedQuery) {
      setResults({ tracks: [], albums: [] });
      setIsSearching(false);
      return;
    }
    
    const fetchResults = async () => {
      setIsSearching(true); // Ignite Loading State
      try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error('Search Engine Pipeline Failed');
        
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search Fetch Error:", error);
      } finally {
        setIsSearching(false); // Kill Loading State (Runs even if fetch fails)
      }
    };

    fetchResults();
  }, [debouncedQuery]);
  return (
    <div className="flex flex-col w-full h-full p-8">
      
      {/* 5. The Centered Input Console (Visually "Middle Top") */}
      <div className="w-full flex justify-center mt-12 mb-16">
        <input
          type="text"
          placeholder="Search tracks and albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full max-w-3xl text-4xl font-bold bg-transparent border-b-2 border-border focus:border-tx-main text-tx-main text-center pb-4 outline-none transition-colors placeholder:text-tx-muted/30"
        />
      </div>

      {/* 6. The State Machine Switch */}
      {!query ? (
        
        // State A: Dormant
        <div className="flex-1 flex flex-col items-center justify-center pb-32">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-tx-muted/50 mb-6">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3 className="text-xl text-tx-muted font-medium">What do you want to listen to?</h3>
        </div>

      ) : isSearching && results.tracks.length === 0 && results.albums.length === 0 ? (
        // State A.5: The Network Wait
        <div className="flex-1 flex justify-center mt-12 text-tx-muted animate-pulse">
           Querying database...
        </div>
      ) : (

        // State B: Active Matrix
        <div className="flex flex-col gap-12 overflow-y-auto pb-24">
          
          {/* TRACKS ROW */}
          {results.tracks.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-tx-main">Tracks</h2>
              
              <ScrollRow>
                {results.tracks.map((track) => (
                  <TrackCard 
                    key={track.id} 
                    track={track} 
                    onClick={() => playTrack(track)} 
                  />
                ))}
              </ScrollRow>
            </section>
          )}

          {/* ALBUMS ROW */}
          {results.albums.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-tx-main">Albums</h2>
              
              <ScrollRow>
                {results.albums.map((album) => (
                  <AlbumCard 
                    key={album.id} 
                    album={album} 
                    onClick={() => navigate(`/albums/${album.id}/tracks`)} 
                  />
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Null State: No results found */}
          {results.tracks.length === 0 && results.albums.length === 0 && (
             <div className="w-full text-center text-tx-muted mt-12">
               No results found for "{debouncedQuery}"
             </div>
          )}

        </div>
      )}
    </div>
  );
}
