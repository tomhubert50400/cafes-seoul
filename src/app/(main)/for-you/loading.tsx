export default function ForYouLoading() {
  return (
    <div className="flex flex-col bg-black">
      <main className="flex-1">
        <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
          <div className="absolute inset-0 animate-pulse bg-zinc-900" />
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
            <div className="h-7 w-2/3 rounded bg-zinc-700" />
            <div className="h-5 w-1/3 rounded bg-zinc-800" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 w-20 rounded-full bg-zinc-800" />
              <div className="h-8 w-16 rounded-full bg-zinc-800" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
