// This is the static left-hand navigation. This tells the router to swap the page in memory without triggering a hard browser refresh, by using react-router-dom.

import { Link, useLocation } from 'react-router-dom';
import usePlayerStore from '../../store/usePlayerStore';
import useTheme from '../../hooks/useTheme';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);


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
  
  const { theme, toggleTheme } = useTheme();

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
              flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
              transition-colors duration-150 relative
              ${isActive
                ? 'bg-surface-hover text-primary'
                : 'text-tx-muted hover:text-tx-main hover:bg-surface-hover/50'
              }
            `}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-full" />
              )}
              
              {link.name}
            </Link>
          );
        })}
      </nav>
    
      <div className="px-2 pb-5 pt-2 border-t border-border mt-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-tx-muted hover:text-tx-main hover:bg-surface-hover/50 transition-colors duration-150"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
