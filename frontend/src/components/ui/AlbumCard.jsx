export default function AlbumCard({ album, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="min-w-[160px] max-w-[160px] snap-start group cursor-pointer flex flex-col gap-2"
    >
      <div className="w-full aspect-square bg-surface-hover rounded-md overflow-hidden shadow-md">
        <img 
          src={`http://localhost:3000/api/art/${album.id}`} 
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          // Graceful degradation if the SQLite album_id has no physical artwork on disk
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div className="flex flex-col">
        <h3 className="text-tx-main font-bold text-sm truncate">{album.title}</h3>
        <p className="text-xs text-tx-muted truncate">
          Album
        </p>
      </div>
    </div>
  );
}
