export default function ScrollRow({ children }) {
  return (
    <div className="flex flex-row flex-nowrap overflow-x-auto gap-6 pb-4 snap-x">
      {children}
    </div>
  );
}
