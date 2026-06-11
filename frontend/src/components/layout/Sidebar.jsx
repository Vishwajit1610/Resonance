// This is the static left-hand navigation. This tells the router to swap the page in memory without triggering a hard browser refresh, by using react-router-dom.

import { Link, useLocation } from 'react-router-dom';
import usePlayerStore from '../../store/usePlayerStore';

export default function Sidebar() {
  const location = useLocation();
  const isSidebarOpen = usePlayerStore((state) => state.isSidebarOpen);
  const toggleSidebar = usePlayerStore((state) => state.toggleSidebar);  

  // Array block to keep the DOM clean and prevent repetative code blocks 
  const navLinks = [
    { name: 'Home', path: '/'},
    { name: 'Search', path: '/search'},
    { name: 'Artists', path: '/artists'},
    { name: 'Albums', path: '/albums'}
  ];

  return (
    <aside 
      className={`
        w-64 bg-surface border-r border-border p-6 flex flex-col gap-6 flex-shrink-0
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'ml-0' : '-ml-64'}
      `}
    >      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tighter text-tx-main">RESONANCE</h2>
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 text-tx-muted hover:text-tx-main hover:bg-surface-hover/50 rounded-md transition-colors"
        >
          {/* Close (X) SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>      

      <nav className="flex flex-col gap-2"> 
        {navLinks.map((link) => {
          // Guard the root path, otherwise everything matches '/'
          const isActive = link.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(link.path);
          
          return (
            <Link              
              key={link.name}
              to={link.path} 
              className={`
                px-4 py-2 rounded-md font-semibold transition-all duration-200
                ${isActive 
                  ? 'bg-surface-hover text-tx-main shadow-sm' 
                  : 'text-tx-muted hover:text-tx-main hover:bg-surface-hover/50'
                }
              `}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
