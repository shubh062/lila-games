import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });

export default function Home() {
  return (
    <main className="h-screen max-h-screen overflow-hidden bg-zinc-950 text-zinc-50 flex flex-col">
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur shrink-0 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold tracking-tighter border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            LB
          </div>
          <h1 className="font-semibold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            LILA BLACK <span className="text-zinc-500 text-sm font-normal ml-2">Strategic Command</span>
          </h1>
        </div>
      </header>
      <Dashboard />
    </main>
  );
}
