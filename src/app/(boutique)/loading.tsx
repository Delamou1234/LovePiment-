export default function BoutiqueLoading() {
  return (
    <div className="container-shop py-10 animate-pulse space-y-8">
      <div className="h-8 w-48 rounded-lg bg-[#F2D4DC]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] rounded-xl bg-[#F2D4DC]" />
            <div className="h-4 w-3/4 rounded bg-[#F2D4DC]" />
            <div className="h-4 w-1/2 rounded bg-[#F2D4DC]" />
          </div>
        ))}
      </div>
    </div>
  );
}
