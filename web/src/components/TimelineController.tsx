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
  const [speedMultiplier, setSpeedMultiplier] = useState(0.2);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const minTime = matchData?.events[0]?.ts || 0;
  const maxTime = matchData?.events[matchData.events.length - 1]?.ts || 100;
  
  // Convert ms offset to string mm:ss
  const formatTime = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor((ms - minTime) / 1000));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const loop = (timestamp: number) => {
      if (lastUpdateRef.current === 0) lastUpdateRef.current = timestamp;
      const deltaMs = timestamp - lastUpdateRef.current;
      lastUpdateRef.current = timestamp;

      setCurrentTime((prev) => {
        // Assume baseline 1x speed is realistic time. E.g. x times actual delta
        const nextTime = prev + (deltaMs * speedMultiplier * 10); // 10x base speed for UX
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
  }, [isPlaying, speedMultiplier, maxTime, setCurrentTime]);

  // Reset when match changes
  useEffect(() => {
    setIsPlaying(false);
  }, [matchData]);

  if (!matchData) return <div className="h-16 shrink-0 bg-zinc-950 border-t border-zinc-800" />;

  const progressPct = Math.max(0, Math.min(100, ((currentTime - minTime) / (maxTime - minTime)) * 100)) || 0;

  return (
    <div className="h-20 shrink-0 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800 flex flex-col justify-center px-6 fixed bottom-0 left-80 right-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      {/* Slider */}
      <div className="relative w-full h-1.5 bg-zinc-800 rounded-full mb-3 group cursor-pointer"
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const pct = (e.clientX - rect.left) / rect.width;
             setCurrentTime(minTime + Math.floor(pct * (maxTime - minTime)));
           }}>
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] pointer-events-none transition-all duration-75"
          style={{ width: `${progressPct}%` }}
        />
        <div 
          className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full shadow border-2 border-cyan-400 group-hover:scale-125 transition-transform opacity-0 group-hover:opacity-100"
          style={{ left: `calc(${progressPct}% - 8px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between text-zinc-400 text-xs">
        <div className="w-20 font-mono text-zinc-300">
          {formatTime(currentTime)}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentTime(minTime)}
            className="hover:text-white transition-colors"
          >
            <SkipBack className="fill-current w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
          </button>

          <button 
            onClick={() => {
              const speeds = [0.2, 0.5, 0.8, 1, 2, 5];
              const nextSpeed = speeds[(speeds.indexOf(speedMultiplier) + 1) % speeds.length];
              setSpeedMultiplier(nextSpeed);
            }}
            className="flex items-center gap-1 hover:text-white transition-colors font-medium"
          >
            <FastForward className="fill-current w-4 h-4" />
            <span className="w-8 text-center">{speedMultiplier}x</span>
          </button>
        </div>

        <div className="w-20 text-right font-mono text-zinc-500">
          {formatTime(maxTime)}
        </div>
      </div>
    </div>
  );
}
