export default function TrackCard({ track, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="min-w-[160px] max-w-[160px] snap-start group cursor-pointer flex flex-col gap-2"
    >
      <div className="w-full aspect-square bg-surface-hover rounded-md overflow-hidden shadow-md">
        <img 
          src={`http://localhost:3000/api/art/${track.album_id}`} 
          alt={track.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div className="flex flex-col">
        <h3 className="text-tx-main font-bold text-sm truncate">{track.title}</h3>
        <p className="text-xs text-tx-muted truncate">
          {track.artists?.length > 0 ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist'}
        </p>
      </div>
    </div>
  );
}
