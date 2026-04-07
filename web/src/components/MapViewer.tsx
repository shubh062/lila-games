"use client";

import { useMemo, useRef, useEffect } from "react";
import { PlayerEvent } from "./Dashboard";
import { Skull, Crosshair, Package, Zap } from "lucide-react";

export default function MapViewer({ 
  mapId, 
  events, 
  allEvents,
  isLoading,
  showHeatmap,
  entityVisibility
}: { 
  mapId: string;
  events: PlayerEvent[];
  allEvents: PlayerEvent[];
  isLoading: boolean;
  showHeatmap: boolean;
  entityVisibility: 'all' | 'humans' | 'bots';
}) {
  const minimapUrl = `/minimaps/${mapId}_Minimap.${mapId === 'Lockdown' ? 'jpg' : 'png'}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derive match-wide summary stats from allEvents
  const stats = useMemo(() => {
    const humans = new Set<string>();
    const bots = new Set<string>();
    let kills = 0, deaths = 0, stormDeaths = 0, loot = 0;
    for (const e of allEvents) {
      if (e.type === 'Position') humans.add(e.player);
      if (e.type === 'BotPosition') bots.add(e.player);
      if (e.type === 'BotKill' || e.type === 'Kill') kills++;
      if (e.type === 'BotKilled' || e.type === 'Killed') deaths++;
      if (e.type === "KilledByStorm") stormDeaths++;
      if (e.type === "Loot") loot++;
    }
    return { humans: humans.size, bots: bots.size, kills, deaths, stormDeaths, loot };
  }, [allEvents]);

  // Group paths by player — apply entity filter + skip invalid (0,0) coords
  const paths = useMemo(() => {
    const playerPaths: Record<string, { isHuman: boolean; points: { x: number; y: number }[] }> = {};
    for (const e of events) {
      if (e.type === 'Position' || e.type === 'BotPosition') {
        // Skip uninitialized coordinates
        if (e.px === 0 && e.py === 0) continue;
        // Apply entity visibility filter
        if (entityVisibility === 'humans' && !e.is_human) continue;
        if (entityVisibility === 'bots' && e.is_human) continue;

        if (!playerPaths[e.player]) {
          playerPaths[e.player] = { isHuman: e.is_human, points: [] };
        }
        playerPaths[e.player].points.push({ x: e.px, y: e.py });
      }
    }
    return playerPaths;
  }, [events, entityVisibility]);

  // Discrete event icons — filter out invalid coords
  const discreteEvents = useMemo(() => {
    return events.filter(e => {
      if (e.type === 'Position' || e.type === 'BotPosition') return false;
      if (e.px === 0 && e.py === 0) return false;
      return true;
    });
  }, [events]);

  // Heatmap canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showHeatmap) return;

    const combatEvents = allEvents.filter(e =>
      (e.type === 'BotKill' || e.type === 'Kill' || e.type === 'BotKilled' || e.type === 'Killed') &&
      !(e.px === 0 && e.py === 0)
    );

    combatEvents.forEach(evt => {
      const isKill = evt.type === 'BotKill' || evt.type === 'Kill';
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
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main map container */}
      <div className="relative w-full max-w-[80vh] aspect-square rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.05)] border border-white/5 ring-1 ring-white/10">
        <img
          src={minimapUrl}
          alt={mapId}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Heatmap Canvas Layer */}
        <canvas
          ref={canvasRef}
          width={1024}
          height={1024}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80 transition-opacity duration-500"
          style={{
            filter: 'blur(8px) saturate(1.5)',
            visibility: showHeatmap ? 'visible' : 'hidden'
          }}
        />

        {/* SVG: Paths + Head Dots with H/B label */}
        <svg viewBox="0 0 1024 1024" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
          {Object.entries(paths).map(([playerId, data]) => {
            const pointsStr = data.points.map(p => `${p.x},${p.y}`).join(' ');
            return (
              <polyline
                key={playerId}
                points={pointsStr}
                fill="none"
                stroke={data.isHuman ? "rgba(59, 130, 246, 0.6)" : "rgba(156, 163, 175, 0.3)"}
                strokeWidth={data.isHuman ? 3 : 1.5}
                strokeDasharray={data.isHuman ? "none" : "4 4"}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`pointer-events-auto cursor-help ${data.isHuman ? "drop-shadow-[0_0_2px_#3b82f6]" : ""}`}
              >
                <title>{`${data.isHuman ? '🟦 Human' : '⬜ Bot'}: ${playerId}\nPath length: ${data.points.length} points`}</title>
              </polyline>
            );
          })}

          {/* Head dots with H/B identity badge */}
          {Object.entries(paths).map(([playerId, data]) => {
            if (data.points.length === 0) return null;
            const last = data.points[data.points.length - 1];
            return (
              <g key={`head-${playerId}`}>
                <circle
                  cx={last.x}
                  cy={last.y}
                  r={data.isHuman ? 6 : 4}
                  fill={data.isHuman ? "#60a5fa" : "#d1d5db"}
                  className={data.isHuman ? "drop-shadow-[0_0_6px_#60a5fa]" : ""}
                />
                {/* Small H or B label next to the head dot */}
                <text
                  x={last.x + 8}
                  y={last.y + 4}
                  fill={data.isHuman ? "#93c5fd" : "#9ca3af"}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {data.isHuman ? "H" : "B"}
                </text>
              </g>
            );
          })}
        </svg>

        {/* HTML Discrete Event Icons */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {discreteEvents.map((evt) => {
            const x = `${(evt.px / 1024) * 100}%`;
            const y = `${(evt.py / 1024) * 100}%`;

            let Icon = null;
            let colorCls = "";
            const size = 16;

            // BotKill = where the killing shot originated (killer's position) → green crosshair
            // Kill = rare human-on-human kill → green crosshair
            if (evt.type === 'BotKill' || evt.type === 'Kill') {
              Icon = <Crosshair size={size} />;
              colorCls = "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]";
            // BotKilled = where the bot fell (victim's position) → red skull
            // Killed = rare human-on-human death → red skull
            } else if (evt.type === 'BotKilled' || evt.type === 'Killed') {
              Icon = <Skull size={size} />;
              colorCls = "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]";
            } else if (evt.type === 'Loot') {
              Icon = <Package size={14} />;
              colorCls = "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]";
            } else if (evt.type === 'KilledByStorm') {
              Icon = <Zap size={size} />;
              colorCls = "text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,1)]";
            }

            if (!Icon) return null;

            return (
              <div
                key={`${evt.player}-${evt.type}-${evt.ts}`}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${colorCls} animate-in fade-in zoom-in duration-300`}
                style={{ left: x, top: y }}
                title={`${evt.type} · ${evt.player.slice(0, 8)}... · ${Math.floor((evt.ts) / 1000)}s`}
              >
                {Icon}
              </div>
            );
          })}
        </div>

        {/* ─── Stats Bar (top overlay) ─── */}
        {allEvents.length > 0 && (
          <div className="absolute top-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-3 text-[10px] font-mono z-10 border-b border-white/5">
            <span className="text-blue-400 flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-blue-400" />
              {stats.humans} Human{stats.humans !== 1 ? 's' : ''}
            </span>
            <span className="text-zinc-500 flex items-center gap-1.5">
              <span className="inline-block w-4 border-t border-dashed border-zinc-500" />
              {stats.bots} Bot{stats.bots !== 1 ? 's' : ''}
            </span>
            <span className="text-zinc-700">│</span>
            <span className="text-green-400">🎯 {stats.kills}</span>
            <span className="text-red-400">💀 {stats.deaths}</span>
            {stats.stormDeaths > 0 && <span className="text-fuchsia-400">⚡ {stats.stormDeaths} storm</span>}
            {stats.loot > 0 && <span className="text-amber-400">📦 {stats.loot}</span>}
          </div>
        )}

        {/* ─── Legend Panel (bottom-left overlay) ─── */}
        <div className="absolute bottom-2 left-2 z-10 bg-zinc-950/85 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-2 space-y-1">
          <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5">Legend</p>

          {/* Path types */}
          <div className="flex items-center gap-2 text-[10px] text-blue-300">
            <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#60a5fa" strokeWidth="2" /></svg>
            Human Player (H)
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
            Bot / AI (B)
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-1" />

          {/* Event icon types */}
          <div className="flex items-center gap-2 text-[10px] text-green-400">
            <Crosshair size={10} /> Kill
          </div>
          <div className="flex items-center gap-2 text-[10px] text-red-400">
            <Skull size={10} /> Player Death
          </div>
          <div className="flex items-center gap-2 text-[10px] text-fuchsia-400">
            <Zap size={10} /> Storm Death
          </div>
          <div className="flex items-center gap-2 text-[10px] text-amber-400">
            <Package size={10} /> Loot
          </div>
        </div>
      </div>
    </div>
  );
}
