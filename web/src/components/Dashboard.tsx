"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import MapViewer from "./MapViewer";
import TimelineController from "./TimelineController";
import MapInsightsPanel, { InsightMode, MapInsights } from "./MapInsightsPanel";

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

  // Visual filter states
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(
    new Set(["Kill", "Killed", "Loot", "KilledByStorm"])
  );
  // Entity path visibility: all | humans | bots
  const [entityVisibility, setEntityVisibility] = useState<'all' | 'humans' | 'bots'>('all');

  // Map Insights state
  const [mapInsights, setMapInsights] = useState<MapInsights | null>(null);
  const [activeInsightMode, setActiveInsightMode] = useState<InsightMode>(null);

  // Load match index
  useEffect(() => {
    fetch("/data/matches_index.json")
      .then((res) => res.json())
      .then((data) => {
        setIndex(data);
        if (!selectedMatchId && data.length > 0) {
          const defaultMatch = data.find((d: MatchIndex) => d.map_id === "AmbroseValley") || data[0];
          setSelectedMatchId(defaultMatch.match_id);
          setSelectedMap(defaultMatch.map_id);
          setSelectedDate(defaultMatch.date);
        }
      })
      .catch(console.error);
  }, []);

  // Load match data when selection changes
  useEffect(() => {
    if (!selectedMatchId) return;
    setIsLoading(true);
    fetch(`/data/${selectedMatchId}.json`)
      .then((res) => res.json())
      .then((data) => {
        setMatchData(data);
        setIsLoading(false);
        if (data.events && data.events.length > 0) {
          setCurrentTime(data.events[0].ts);
        }
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [selectedMatchId]);

  // Load map insights when selected map changes
  useEffect(() => {
    fetch(`/data/map_insights_${selectedMap}.json`)
      .then((res) => res.json())
      .then((data) => setMapInsights(data))
      .catch((err) => {
        console.error("Failed to load map insights:", err);
        setMapInsights(null);
      });
    // Reset insight mode when switching maps
    setActiveInsightMode(null);
  }, [selectedMap]);

  // Derived visible events based on timeline + event type filters
  const visibleEvents = useMemo(() => {
    if (!matchData) return [];
    const TRAIL_MS = 120000;
    return matchData.events.filter(e => {
      const isTimeValid = e.ts <= currentTime && e.ts >= currentTime - TRAIL_MS;
      // Position events always pass through (filtered by entityVisibility in MapViewer)
      if (e.type === 'Position' || e.type === 'BotPosition') return isTimeValid;
      
      // Map real event types to filter category IDs
      // BotKill = shooter's position (green crosshair = a kill happened)
      // BotKilled = victim's position (red skull = where a bot fell)
      // Kill / Killed = rare human-on-human events
      // KilledByStorm = independent storm category
      let normalizedType = e.type;
      if (e.type === 'BotKill' || e.type === 'Kill') normalizedType = 'Kill';
      else if (e.type === 'BotKilled' || e.type === 'Killed') normalizedType = 'Killed';
      // KilledByStorm and Loot stay as-is

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
        entityVisibility={entityVisibility}
        setEntityVisibility={setEntityVisibility}
      />
      <div className="flex-1 flex flex-col relative bg-zinc-900 border-l border-zinc-800">
        <MapViewer 
          mapId={selectedMap} 
          events={visibleEvents} 
          allEvents={matchData?.events || []}
          isLoading={isLoading} 
          showHeatmap={showHeatmap}
          entityVisibility={entityVisibility}
          insightMode={activeInsightMode}
          mapInsights={mapInsights}
        />
        <TimelineController 
          matchData={matchData} 
          currentTime={currentTime} 
          setCurrentTime={setCurrentTime} 
        />
      </div>
      <MapInsightsPanel
        insights={mapInsights}
        activeMode={activeInsightMode}
        setActiveMode={setActiveInsightMode}
      />
    </div>
  );
}
