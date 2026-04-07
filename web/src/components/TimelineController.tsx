"use client";

import { useEffect, useState, useRef } from "react";
import { MatchData } from "./Dashboard";
import { Play, Pause, SkipBack, SkipForward, FastForward } from "lucide-react";

export default function TimelineController({
  matchData,
  currentTime,
  setCurrentTime,
}: {
  matchData: MatchData | null;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // SAFE ACCESSORS
  const minTime = matchData?.events?.[0]?.ts || 0;
  const maxTime = matchData?.events ? matchData.events[matchData.events.length - 1]?.ts || 100 : 100;
  
  const formatTime = (ts: number) => {
    const totalSecs = Math.max(0, Math.floor(ts - minTime));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isPlaying || !matchData) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const loop = (timestamp: number) => {
      if (lastUpdateRef.current === 0) lastUpdateRef.current = timestamp;
      const deltaMs = timestamp - lastUpdateRef.current;
      lastUpdateRef.current = timestamp;

      setCurrentTime((prev) => {
        // Safe match speed (approx 1x real time for 1000ms wall = 1s match)
        const nextTime = prev + (deltaMs * speedMultiplier * 10); 
        if (nextTime >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return nextTime;
      });

      animationRef.current = requestAnimationFrame(loop);
    };

    lastUpdateRef.current = performance.now();
    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speedMultiplier, maxTime, setCurrentTime, matchData]);

  useEffect(() => {
    setIsPlaying(false);
  }, [matchData]);

  if (!matchData) return <div className="h-20 shrink-0 bg-zinc-950/80 border-t border-zinc-800" />;

  const progressPct = Math.max(0, Math.min(100, ((currentTime - minTime) / (maxTime - minTime)) * 100)) || 0;

  return (
    <div className="h-20 shrink-0 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800 flex flex-col justify-center px-6 fixed bottom-0 left-80 right-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      <div className="relative w-full h-1.5 bg-zinc-800 rounded-full mb-3 group cursor-pointer"
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const pct = (e.clientX - rect.left) / rect.width;
             setCurrentTime(minTime + Math.floor(pct * (maxTime - minTime)));
           }}>
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
        <div 
          className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full border-2 border-cyan-400 group-hover:scale-125 transition-transform"
          style={{ left: `calc(${progressPct}% - 8px)` }}
        />
      </div>

      <div className="flex items-center justify-between text-zinc-400 text-xs">
        <div className="w-20 font-mono text-zinc-300">{formatTime(currentTime)}</div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentTime(minTime)} className="hover:text-white"><SkipBack className="w-4 h-4" /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center hover:scale-105 transition-all"
          >
            {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
          </button>
          <button 
            onClick={() => {
              const speeds = [1, 2, 5, 10];
              const nextSpeed = speeds[(speeds.indexOf(speedMultiplier) + 1) % speeds.length];
              setSpeedMultiplier(nextSpeed);
            }}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <FastForward className="w-4 h-4" />
            <span>{speedMultiplier}x</span>
          </button>
        </div>

        <div className="w-20 text-right font-mono text-zinc-500">{formatTime(maxTime)}</div>
      </div>
    </div>
  );
}
