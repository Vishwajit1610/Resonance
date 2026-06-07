import { useState, useEffect } from 'react';

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/artists')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch artists');
        return response.json();
      })
      .then((data) => {
        setArtists(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Network Error: ', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="p-8">
        {/* We keep literal red here as it's an absolute error state, not a theme color */}
        <h1 className="text-3xl text-red-500 font-bold mb-4">System Fault</h1>
        <p className="text-tx-muted">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <h1 className="text-3xl font-bold animate-pulse text-tx-muted p-8">Hydrating Engine...</h1>;
  }

  return (
    <div className="p-8 w-full text-tx-main">
      <h1 className="text-4xl font-bold mb-8 tracking-tight">Artists</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {artists.map((artist) => (
          <div 
            key={artist.id} 
            className="bg-surface border border-border p-6 rounded-xl hover:bg-surface-hover transition cursor-pointer flex items-center justify-center text-center min-h-[120px]"
          >
            <h3 className="font-semibold text-lg">{artist.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
