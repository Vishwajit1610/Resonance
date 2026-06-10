import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Albums() {
  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/albums')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch albums');
        return response.json();
      })
      .then((data) => {
        setAlbums(data);
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
      <h1 className="text-4xl font-bold mb-8 tracking-tight">Albums</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {albums.map((album) => (
          <Link
            key={album.id}
            to={`/albums/${album.id}/tracks`}
            className="group flex flex-col gap-3 w-full"
          >
            <div className="w-full aspect-square bg-surface-hover rounded-md overflow-hidden shadow-md">
              <img
                src={`http://localhost:3000/api/art/${album.id}`}
                alt={album.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="flex flex-col">
              <h3 className="text-tx-main font-bold truncate">
                {album.title}
              </h3>

              <p className="text-sm text-tx-muted truncate">
                {album.artists || 'Unknown Artist'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
