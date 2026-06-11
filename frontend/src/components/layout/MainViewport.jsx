import { Routes, Route } from 'react-router-dom';
import Home from '../../views/Home';
import Artists from '../../views/Artists';
import AlbumTracks from '../../views/AlbumTracks';
import Albums from '../../views/Albums';
import Search from '../../views/Search';

export default function MainViewport() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-8">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/search" element={<Search />} />

        {/* Dynamic Route: The :id is captured by useParams() */}
        <Route path="/albums/:id/tracks" element={<AlbumTracks />} />

      </Routes>
    </main>
  );
}
