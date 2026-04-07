"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import MapViewer from "./MapViewer";
import TimelineController from "./TimelineController";

export type MatchIndex = {
  match_id: string;
  map_id: string;
  date: string;
  humans_count: number;
  bots_count: number;
  events_count: number;
};

export type PlayerEvent = {
  player: string;
  is_human: boolean;
  type: string;
  ts: number;
  px: number;
  py: number;
};

export type MatchData = {
  match_id: string;
  map_id: string;
  date: string;
  humans_count: number;
  bots_count: number;
  events_count: number;
  events: PlayerEvent[];
};

export default function Dashboard() {
  const [index, setIndex] = useState<MatchIndex[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("AmbroseValley");
  const [selectedDate, setSelectedDate] = useState<string>("All");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Premium Visual States
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(new Set(["Kill", "Killed", "Loot", "KilledByStorm"]));

  useEffect(() => {
    fetch("/data/matches_index.json")
      .then((res) => res.json())
      .then((data) => {
        setIndex(data);
        // Autoselect a match if none selected
        if (!selectedMatchId && data.length > 0) {
          const defaultMatch = data.find((d: MatchIndex) => d.map_id === "AmbroseValley") || data[0];
          setSelectedMatchId(defaultMatch.match_id);
          setSelectedMap(defaultMatch.map_id);
          setSelectedDate(defaultMatch.date);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    setIsLoading(true);
    fetch(`/data/${selectedMatchId}.json`)
      .then((res) => res.json())
      .then((data) => {
        setMatchData(data);
        setIsLoading(false);
        // Reset timeline
        if (data.events && data.events.length > 0) {
          setCurrentTime(data.events[0].ts);
        }
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [selectedMatchId]);

  // Derived visible events based on currentTime and filters
  const visibleEvents = useMemo(() => {
    if (!matchData) return [];
    // Show events from start up to current time (or within a trailing window?)
    // A trail of 120 seconds looks good
    const TRAIL_MS = 120000;
    return matchData.events.filter(e => {
      const isTimeValid = e.ts <= currentTime && e.ts >= currentTime - TRAIL_MS;
      if (e.type === 'Position' || e.type === 'BotPosition') return isTimeValid;
      
      // For discrete events, check the visible types filter
      // Normalize type name for filter check
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
      <div className="flex-1 flex flex-col relative bg-zinc-900 border-l border-zinc-800">
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
