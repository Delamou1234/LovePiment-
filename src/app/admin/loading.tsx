export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-fadeIn" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <div className="skeleton h-8 w-56 rounded-lg" />
        <div className="skeleton h-4 w-80 max-w-full rounded-lg" />
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-[4.5rem] rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-[28rem] rounded-xl" />
    </div>
  );
}
