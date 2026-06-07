// This is the static left-hand navigation. This tells the router to swap the page in memory without triggering a hard browser refresh, by using react-router-dom.

import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface border-r border-border p-6 flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tighter text-tx-main">RESONANCE</h2>
      <nav className="flex flex-col gap-4 text-tx-muted font-semibold"> 
        <Link to="/" className="hover:text-tx-main transition">Home</Link>
        <Link to="/artists" className="hover:text-tx-main transition">Artists</Link>
        <Link to="/albums" className="hover:text-tx-main transition">Albums</Link>
      </nav>
    </aside>
  );
}
