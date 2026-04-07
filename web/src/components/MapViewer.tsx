"use client";

import { useMemo, useRef, useEffect } from "react";
import { PlayerEvent } from "./Dashboard";
import { Skull, Crosshair, Package } from "lucide-react";

export default function MapViewer({ 
  mapId, 
  events, 
  allEvents,
  isLoading,
  showHeatmap
}: { 
  mapId: string, 
  events: PlayerEvent[],
  allEvents: PlayerEvent[],
  isLoading: boolean,
  showHeatmap: boolean
}) {
  const minimapUrl = `/minimaps/${mapId}_Minimap.${mapId === 'Lockdown' ? 'jpg' : 'png'}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
  };

  // Group paths by player
  const paths = useMemo(() => {
    const playerPaths: Record<string, { isHuman: boolean, points: {x:number, y:number}[] }> = {};
    for (const e of events) {
      if (e.type === 'Position' || e.type === 'BotPosition') {
        if (!playerPaths[e.player]) {
          playerPaths[e.player] = { isHuman: e.is_human, points: [] };
        }
        playerPaths[e.player].points.push({ x: e.px, y: e.py });
      }
    }
    return playerPaths;
  }, [events]);

  const discreteEvents = useMemo(() => {
    return events.filter(e => e.type !== 'Position' && e.type !== 'BotPosition');
  }, [events]);

  // Heatmap Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showHeatmap) return;

    const combatEvents = allEvents.filter(e => e.type.includes("Kill") || e.type.includes("Killed"));
    combatEvents.forEach(evt => {
      const isKill = evt.type.includes("Kill") && !evt.type.includes("Killed");
      const gradient = ctx.createRadialGradient(evt.px, evt.py, 2, evt.px, evt.py, 20);
      if (isKill) {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(evt.px - 20, evt.py - 20, 40, 40);
    });
  }, [allEvents, showHeatmap]);

  return (
    <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center p-4">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      )}

      <div className="relative w-full max-w-[80vh] aspect-square rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.05)] border border-white/5">
        <img 
          src={minimapUrl} 
          alt={mapId}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
          style={{ imageRendering: 'pixelated' }}
        />

        <canvas
          ref={canvasRef}
          width={1024}
          height={1024}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
          style={{ filter: 'blur(8px) saturate(1.5)', visibility: showHeatmap ? 'visible' : 'hidden' }}
        />

        <svg viewBox="0 0 1024 1024" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md z-20">
          {Object.entries(paths).map(([playerId, data]) => {
            if (data.points.length === 0) return null;
            const pointsStr = data.points.map(p => `${p.x},${p.y}`).join(' ');
            const last = data.points[data.points.length - 1];
            return (
              <g key={playerId}>
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={data.isHuman ? "rgba(59, 130, 246, 0.6)" : "rgba(156, 163, 175, 0.3)"}
                  strokeWidth={data.isHuman ? 3 : 1.5}
                  strokeDasharray={data.isHuman ? "none" : "4 4"}
                />
                <circle
                  cx={last.x}
                  cy={last.y}
                  r={data.isHuman ? 5 : 3}
                  fill={data.isHuman ? "#60a5fa" : "#9ca3af"}
                  className={data.isHuman ? "drop-shadow-[0_0_6px_#60a5fa]" : ""}
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0 w-full h-full pointer-events-none z-30">
          {discreteEvents.map((evt, idx) => {
            const x = `${(evt.px / 1024) * 100}%`;
            const y = `${(evt.py / 1024) * 100}%`;
            let Icon = null;
            let colorCls = "";
            let size = 16;
            
            if (evt.type.includes("Kill") && !evt.type.includes("Killed")) {
              Icon = <Crosshair size={size} />;
              colorCls = "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]";
            } else if (evt.type.includes("Killed") && !evt.type.includes("Storm")) {
              Icon = <Skull size={size} />;
              colorCls = "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]";
            } else if (evt.type === "Loot") {
              Icon = <Package size={14} />;
              colorCls = "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]";
            } else if (evt.type === "KilledByStorm") {
              Icon = <Skull size={size} />;
              colorCls = "text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,1)]";
            }

            if (!Icon) return null;
            return (
              <div 
                key={`${evt.player}-${evt.ts}-${evt.type}`}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${colorCls} pointer-events-auto cursor-help`}
                style={{ left: x, top: y }}
                title={`${evt.type} by ${evt.player} at ${formatTimestamp(evt.ts)}`}
              >
                {Icon}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
