"use client";

import { useMemo } from "react";
import React from "react";
import { MatchIndex } from "./Dashboard";
import { Map, Calendar, Users, Cpu, Activity, Flame, Eye, EyeOff, Package, Skull, Crosshair, Zap, User } from "lucide-react";

export default function Sidebar({
  index,
  selectedMap,
  setSelectedMap,
  selectedDate,
  setSelectedDate,
  selectedMatchId,
  setSelectedMatchId,
  showHeatmap,
  setShowHeatmap,
  visibleEventTypes,
  setVisibleEventTypes,
  entityVisibility,
  setEntityVisibility,
}: {
  index: MatchIndex[];
  selectedMap: string;
  setSelectedMap: (m: string) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string) => void;
  showHeatmap: boolean;
  setShowHeatmap: (v: boolean) => void;
  visibleEventTypes: Set<string>;
  setVisibleEventTypes: React.Dispatch<React.SetStateAction<Set<string>>>;
  entityVisibility: 'all' | 'humans' | 'bots';
  setEntityVisibility: (v: 'all' | 'humans' | 'bots') => void;
}) {
  const maps = ["AmbroseValley", "GrandRift", "Lockdown"];
  const dates = ["All", ...Array.from(new Set(index.map((d) => d.date))).sort()];

  const filteredMatches = useMemo(() => {
    return index.filter(
      (m) =>
        m.map_id === selectedMap &&
        (selectedDate === "All" || m.date === selectedDate)
    ).sort((a, b) => b.events_count - a.events_count);
  }, [index, selectedMap, selectedDate]);

  const EVENT_TOGGLES = [
    { id: 'Kill', label: 'Kills', Icon: Crosshair, activeColor: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    { id: 'Killed', label: 'Deaths', Icon: Skull, activeColor: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
    { id: 'Loot', label: 'Loot', Icon: Package, activeColor: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
    { id: 'KilledByStorm', label: 'Storm', Icon: Zap, activeColor: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/10', borderColor: 'border-fuchsia-500/30' },
  ];

  const ENTITY_OPTIONS: { value: 'all' | 'humans' | 'bots'; label: string; Icon: React.ElementType; color: string }[] = [
    { value: 'all', label: 'All', Icon: Users, color: 'text-zinc-300' },
    { value: 'humans', label: 'Humans', Icon: User, color: 'text-blue-400' },
    { value: 'bots', label: 'Bots', Icon: Cpu, color: 'text-zinc-400' },
  ];

  return (
    <aside className="w-80 bg-zinc-950 flex flex-col shrink-0 text-sm overflow-hidden">
      <div className="p-4 space-y-4 border-b border-zinc-800">
        {/* Map Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5" /> Map Location
          </label>
          <div className="flex bg-zinc-900 rounded p-1 shadow-inner border border-zinc-800">
            {maps.map((map) => (
              <button
                key={map}
                onClick={() => setSelectedMap(map)}
                className={`flex-1 text-xs py-1.5 rounded transition-all ${
                  selectedMap === map
                    ? "bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)] font-medium border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
                }`}
              >
                {map.replace("Valley", " V.").replace("Rift", " R.")}
              </button>
            ))}
          </div>
        </div>

        {/* Date Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Date Selection
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-1.5 text-xs outline-none focus:border-purple-500/50"
          >
            {dates.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Visual Layers */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/50">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Visual Layers
          </label>

          <div className="flex flex-col gap-2">
            {/* Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center justify-between w-full p-2 rounded-md border transition-all ${
                showHeatmap
                  ? "bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${showHeatmap ? "animate-pulse" : ""}`} />
                <span className="text-[11px] font-medium uppercase tracking-tight">Heatmap Overlay</span>
              </div>
              {showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-30" />}
            </button>

            {/* Event Type Toggles — 4-up grid (Kill, Death, Loot, Storm) */}
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wide font-semibold mb-1">Event Markers</p>
              <div className="grid grid-cols-4 gap-1">
                {EVENT_TOGGLES.map(({ id, label, Icon, activeColor, bgColor, borderColor }) => {
                  const isActive = visibleEventTypes.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        const next = new Set(visibleEventTypes);
                        if (next.has(id)) next.delete(id); else next.add(id);
                        setVisibleEventTypes(next);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded border transition-all ${
                        isActive ? `${bgColor} ${borderColor} ${activeColor}` : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="text-[8px] uppercase font-bold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entity Path Visibility */}
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wide font-semibold mb-1">Show Paths</p>
              <div className="grid grid-cols-3 gap-1">
                {ENTITY_OPTIONS.map(({ value, label, Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setEntityVisibility(value)}
                    className={`flex flex-col items-center gap-1 py-1.5 rounded border text-[9px] uppercase font-bold transition-all ${
                      entityVisibility === value
                        ? `bg-cyan-500/10 border-cyan-500/40 ${color}`
                        : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-xs text-zinc-500 font-medium">
          <span>{filteredMatches.length} Matches Found</span>
          <span>By Activity</span>
        </div>
        {filteredMatches.slice(0, 50).map((match) => (
          <button
            key={match.match_id}
            onClick={() => setSelectedMatchId(match.match_id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedMatchId === match.match_id
                ? "bg-zinc-800/80 border-cyan-500/50 shadow-[inset_2px_0_0_#22d3ee]"
                : "bg-zinc-900/50 border-transparent hover:bg-zinc-800/50"
            }`}
          >
            <div className="font-mono text-xs text-zinc-300 truncate mb-1.5">
              {match.match_id.split('.')[0]}
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1" title="Human Players">
                <Users className="w-3.5 h-3.5 text-blue-400" /> {match.humans_count}
              </span>
              <span className="flex items-center gap-1" title="Bots">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" /> {match.bots_count}
              </span>
              <span className="flex items-center gap-1 ml-auto" title="Total Events">
                <Activity className="w-3.5 h-3.5 text-amber-500" /> {match.events_count}
              </span>
            </div>
          </button>
        ))}
        {filteredMatches.length > 50 && (
          <div className="text-center p-4 text-zinc-500 text-xs italic">
            Showing top 50 of {filteredMatches.length} matches. Use filters to refine.
          </div>
        )}
        {filteredMatches.length === 0 && (
          <div className="text-center p-8 text-zinc-500 text-sm">
            No matches found for these filters.
          </div>
        )}
      </div>
    </aside>
  );
}
