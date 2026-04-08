"use client";

import { Crosshair, Skull, Package, Zap, MapPin, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";

export type InsightMode = 'kills' | 'deaths' | 'loot' | 'traffic' | 'storm' | null;

export type MapInsights = {
  map_id: string;
  total_matches: number;
  summary: {
    unique_humans: number;
    unique_bots: number;
    total_human_sessions: number;
    total_bot_sessions: number;
    kills: number;
    deaths: number;
    storm_deaths: number;
    loot: number;
  };
  kill_coords: number[][];
  death_coords: number[][];
  loot_coords: number[][];
  storm_coords: number[][];
  traffic_coords: number[][];
  clusters: {
    kill_zones: { cx: number; cy: number; count: number; radius: number }[];
    death_zones: { cx: number; cy: number; count: number; radius: number }[];
    loot_zones: { cx: number; cy: number; count: number; radius: number }[];
    traffic_zones: { cx: number; cy: number; count: number; radius: number }[];
  };
};

const INSIGHT_MODES: { id: InsightMode; label: string; Icon: React.ElementType; color: string; bg: string; border: string; description: string }[] = [
  { id: 'kills', label: 'Kill Zones', Icon: Crosshair, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/40', description: 'Where kills happen most across all matches' },
  { id: 'deaths', label: 'Death Zones', Icon: Skull, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', description: 'Fatalities and bot deaths found across all matches' },
  { id: 'loot', label: 'Loot Density', Icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', description: 'Where players pick up loot' },
  { id: 'traffic', label: 'High Traffic', Icon: MapPin, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', description: 'Most traversed paths and zones' },
  { id: 'storm', label: 'Storm Deaths', Icon: Zap, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/40', description: 'Where storm caught players' },
];

export default function MapInsightsPanel({
  insights,
  activeMode,
  setActiveMode,
}: {
  insights: MapInsights | null;
  activeMode: InsightMode;
  setActiveMode: (mode: InsightMode) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!insights) return null;

  const s = insights.summary;
  const activeConfig = INSIGHT_MODES.find(m => m.id === activeMode);
  const activeClusters = activeMode ? insights.clusters[`${activeMode === 'storm' ? 'kill' : activeMode}_zones` as keyof typeof insights.clusters] : [];

  // Get correct clusters for the active mode
  const getClusters = () => {
    if (!activeMode) return [];
    switch (activeMode) {
      case 'kills': return insights.clusters.kill_zones;
      case 'deaths': return insights.clusters.death_zones;
      case 'loot': return insights.clusters.loot_zones;
      case 'traffic': return insights.clusters.traffic_zones;
      case 'storm': return insights.storm_coords.map((c, i) => ({ cx: c[0], cy: c[1], count: 1, radius: 15 }));
      default: return [];
    }
  };
  const clusters = getClusters();

  if (collapsed) {
    return (
      <div className="w-10 bg-zinc-950 border-l border-zinc-800 flex flex-col items-center pt-3">
        <button
          onClick={() => setCollapsed(false)}
          className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center hover:bg-purple-500/30 transition-colors"
          title="Expand Map Insights"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="mt-3 flex flex-col items-center gap-2">
          <TrendingUp size={14} className="text-zinc-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-[280px] bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Map Insights</h3>
        </div>
        <button onClick={() => setCollapsed(true)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Map Summary */}
      <div className="p-3 border-b border-zinc-800/30 bg-zinc-900/50">
        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
          {insights.map_id} · {insights.total_matches} matches
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{s.unique_humans}</p>
            <p className="text-[8px] text-zinc-500 uppercase">Players</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-400">{s.unique_bots}</p>
            <p className="text-[8px] text-zinc-500 uppercase">Bots</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">{s.kills}</p>
            <p className="text-[8px] text-zinc-500 uppercase">Kills</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">{s.deaths}</p>
            <p className="text-[8px] text-zinc-500 uppercase">Deaths</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-fuchsia-400">{s.storm_deaths}</p>
            <p className="text-[8px] text-zinc-500 uppercase">Storm</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-400">{s.loot}</p>
            <p className="text-[8px] text-zinc-500 uppercase">Loot</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/30 flex justify-between text-[8px] text-zinc-600">
          <span>{s.total_human_sessions} human sessions</span>
          <span>{s.total_bot_sessions} bot sessions</span>
        </div>
      </div>

      {/* Insight Mode Buttons */}
      <div className="p-3 space-y-1.5 border-b border-zinc-800/30">
        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Aggregate Overlay</p>
        {INSIGHT_MODES.map(({ id, label, Icon, color, bg, border, description }) => {
          const isActive = activeMode === id;
          return (
            <button
              key={id}
              onClick={() => setActiveMode(isActive ? null : id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-200 group ${
                isActive
                  ? `${bg} ${border} ${color} shadow-lg`
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <Icon size={14} className={isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'} />
              <div className="text-left flex-1">
                <p className="text-[11px] font-semibold">{label}</p>
                <p className={`text-[8px] ${isActive ? 'opacity-70' : 'text-zinc-600'}`}>{description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mode Details — cluster list */}
      {activeMode && clusters.length > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
            {activeConfig?.label} — Top Zones
          </p>
          {clusters.map((zone, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded border bg-zinc-900/50 border-zinc-800/50 ${activeConfig?.color}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-600">#{i+1}</span>
                <span className="text-[10px] font-medium">
                  ({Math.round(zone.cx)}, {Math.round(zone.cy)})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold">{zone.count}</span>
                <span className="text-[8px] text-zinc-600">events</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!activeMode && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
            Select an overlay above to see aggregate spatial data across all {insights.total_matches} matches on this map
          </p>
        </div>
      )}
    </div>
  );
}
