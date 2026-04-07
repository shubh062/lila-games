"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import MapViewer from "./MapViewer";
import TimelineController from "./TimelineController";

export interface PlayerEvent {
  player: string;
  is_human: boolean;
  type: string;
  ts: number;
  px: number;
  py: number;
}

export interface MatchIndex {
  match_id: string;
  map_id: string;
  date: string;
  humans_count: number;
  bots_count: number;
  events_count: number;
}

export interface MatchData {
  match_id: string;
  map_id: string;
  date: string;
  events: PlayerEvent[];
}

export default function Dashboard() {
  const [index, setIndex] = useState<MatchIndex[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("AmbroseValley");
  const [selectedDate, setSelectedDate] = useState<string>("All");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Premium Visual States
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(new Set(['Kill', 'Killed', 'Loot']));

  useEffect(() => {
    fetch("/data/matches_index.json")
      .then(res => res.json())
      .then(data => {
        // Safe parsing: handles if data is the array directly or wrapped in {matches: []}
        const matches = Array.isArray(data) ? data : (data.matches || []);
        setIndex(matches);
        const filtered = matches.filter((m: any) => m.map_id === selectedMap);
        if (filtered.length > 0) {
          setSelectedMatchId(filtered[0].match_id);
        }
      });
  }, [selectedMap]);

  useEffect(() => {
    if (!selectedMatchId) return;
    setIsLoading(true);
    fetch(`/data/${selectedMatchId}.json`)
      .then(res => res.json())
      .then(data => {
        setMatchData(data);
        setIsLoading(false);
        if (data.events && data.events.length > 0) {
          setCurrentTime(data.events[0].ts);
        }
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [selectedMatchId]);

  const visibleEvents = useMemo(() => {
    if (!matchData) return [];
    
    // Original trail logic (120 seconds) - this was the state before Gold Polish
    const TRAIL_SEC = 120; 
    return matchData.events.filter(e => {
      const isTimeValid = e.ts <= currentTime && e.ts >= currentTime - TRAIL_SEC;
      if (e.type === 'Position' || e.type === 'BotPosition') return isTimeValid;
      
      let normalizedType = e.type;
      if (e.type.includes("Kill") && !e.type.includes("Killed")) normalizedType = "Kill";
      if (e.type.includes("Killed")) normalizedType = "Killed";

      return isTimeValid && visibleEventTypes.has(normalizedType);
    });
  }, [matchData, currentTime, visibleEventTypes]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <Sidebar
        index={index}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedMatchId={selectedMatchId}
        setSelectedMatchId={setSelectedMatchId}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        visibleEventTypes={visibleEventTypes}
        setVisibleEventTypes={setVisibleEventTypes}
      />
      
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <MapViewer 
          mapId={selectedMap} 
          events={visibleEvents} 
          allEvents={matchData?.events || []}
          isLoading={isLoading} 
          showHeatmap={showHeatmap}
        />
        <TimelineController 
          matchData={matchData} 
          currentTime={currentTime} 
          setCurrentTime={setCurrentTime} 
        />
      </div>
    </div>
  );
}
