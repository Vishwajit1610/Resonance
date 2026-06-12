export default function ScrollRow({ children }) {
  return (
    <div className="flex flex-row flex-nowrap overflow-x-auto gap-5 pb-3 snap-x snap-mandatory pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}
