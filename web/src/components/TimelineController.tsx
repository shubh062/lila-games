"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { MatchData } from "./Dashboard";
import { Play, Pause, SkipBack, Zap, FastForward } from "lucide-react";

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
  const [speedMultiplier, setSpeedMultiplier] = useState(50); // Default to 50x
  const [isFastPreviewing, setIsFastPreviewing] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const minTime = useMemo(() => matchData?.events[0]?.ts || 0, [matchData]);
  const maxTime = useMemo(() => matchData?.events[matchData.events.length - 1]?.ts || 1, [matchData]);
  
  // Convert seconds offset to string mm:ss
  const formatTime = (ts: number) => {
    const totalSecs = Math.max(0, Math.floor(ts - minTime));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startFastPreview = () => {
    if (!matchData) return;
    setCurrentTime(minTime);
    setIsPlaying(true);
    setIsFastPreviewing(true);
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

      // Actual speed calculation
      let activeSpeed = speedMultiplier;
      if (isFastPreviewing) {
        // Zip through the entire match in exactly 3 seconds
        const matchDuration = maxTime - minTime;
        activeSpeed = matchDuration / 3; 
      }

      setCurrentTime((prev) => {
        // ts is in seconds, deltaMs is in milliseconds
        const nextTime = prev + (deltaMs / 1000 * activeSpeed);
        
        if (nextTime >= maxTime) {
          setIsPlaying(false);
          setIsFastPreviewing(false);
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
  }, [isPlaying, speedMultiplier, isFastPreviewing, maxTime, minTime, setCurrentTime]);

  // Reset when match changes
  useEffect(() => {
    setIsPlaying(false);
    setIsFastPreviewing(false);
  }, [matchData]);

  if (!matchData) return <div className="h-20 shrink-0 bg-zinc-950/80 border-t border-zinc-800" />;

  const progressPct = Math.max(0, Math.min(100, ((currentTime - minTime) / (maxTime - minTime)) * 100)) || 0;

  return (
    <div className="h-24 shrink-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 flex flex-col justify-center px-8 z-20 shadow-[0_-15px_50px_rgba(0,0,0,0.6)]">
      
      {/* Native Range Slider */}
      <div className="relative w-full group mb-4">
        <input 
          type="range"
          min={minTime}
          max={maxTime}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            setCurrentTime(parseFloat(e.target.value));
            setIsFastPreviewing(false);
          }}
          className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-400
                     [&::-webkit-slider-runnable-track]:h-1.5
                     [&::-webkit-slider-runnable-track]:rounded-full
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-cyan-400
                     [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.5)]
                     [&::-webkit-slider-thumb]:-mt-[5px]
                     [&::-webkit-slider-thumb]:transition-transform
                     hover:[&::-webkit-slider-thumb]:scale-125 focus:outline-none"
          style={{
            background: `linear-gradient(to right, #a855f7 0%, #22d3ee ${progressPct}%, #27272a ${progressPct}%, #27272a 100%)`
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between text-zinc-400 text-xs">
        <div className="w-24 font-mono text-zinc-300 text-sm tracking-tight">
          <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
          <span className="text-zinc-600 ml-1">/ {formatTime(maxTime)}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              setCurrentTime(minTime);
              setIsFastPreviewing(false);
            }}
            className="hover:text-white transition-colors p-2"
            title="Reset to Start"
          >
            <SkipBack className="fill-current w-5 h-5" />
          </button>

          <button 
            onClick={startFastPreview}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
              isFastPreviewing 
                ? "bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                : "hover:bg-zinc-800 hover:text-amber-400 text-zinc-400"
            }`}
            title="Fast Preview (3s Overview)"
          >
            <Zap className={`w-4 h-4 ${isFastPreviewing ? 'fill-current animate-pulse' : ''}`} />
            <span className="font-bold uppercase tracking-wider text-[10px]">Fast Preview</span>
          </button>
          
          <button 
            onClick={() => {
              setIsPlaying(!isPlaying);
              setIsFastPreviewing(false);
            }}
            className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {isPlaying && !isFastPreviewing ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
          </button>

          <button 
            onClick={() => {
              setIsFastPreviewing(false);
              const speeds = [1, 10, 20, 50, 100];
              const nextIndex = (speeds.indexOf(speedMultiplier) + 1) % speeds.length;
              setSpeedMultiplier(speeds[nextIndex]);
            }}
            className="flex flex-col items-center hover:text-white transition-colors font-medium border border-zinc-800 rounded px-3 py-1 bg-zinc-900/50 min-w-[56px]"
          >
            <span className="text-[10px] text-zinc-500 uppercase leading-none mb-1 font-bold">Speed</span>
            <div className="flex items-center gap-1 group">
              <FastForward className="w-3 h-3 text-cyan-400" />
              <span className="text-sm">{speedMultiplier}x</span>
            </div>
          </button>
        </div>

        <div className="w-24 text-right">
          <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-0.5">Duration</div>
          <div className="font-mono text-zinc-400">{formatTime(maxTime)}</div>
        </div>
      </div>
    </div>
  );
}
