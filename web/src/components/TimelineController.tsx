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
        <div className="w-24 font-mono text-zinc-500 text-sm tracking-tight">
          <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setCurrentTime(minTime);
              setIsFastPreviewing(false);
            }}
            className="hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800/50"
            title="Reset to Start"
          >
            <SkipBack className="fill-current w-5 h-5" />
          </button>

          <button 
            onClick={startFastPreview}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-2 border border-zinc-800/50 ${
              isFastPreviewing 
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                : "bg-zinc-900/40 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isFastPreviewing ? 'fill-current animate-pulse' : ''}`} />
            <span className="font-bold uppercase tracking-wider text-[10px]">Fast Preview</span>
          </button>
          
          <button 
            onClick={() => {
              setIsPlaying(!isPlaying);
              setIsFastPreviewing(false);
            }}
            className="w-11 h-11 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] mx-2"
          >
            {isPlaying && !isFastPreviewing ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
          </button>

          <button 
            onClick={() => {
              setIsFastPreviewing(false);
              const speeds = [1, 10, 20, 50, 100];
              const nextIndex = (speeds.indexOf(speedMultiplier) + 1) % speeds.length;
              setSpeedMultiplier(speeds[nextIndex]);
            }}
            className="flex items-center gap-2 transition-all font-medium border border-zinc-800/50 rounded-full px-4 py-1.5 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800 min-w-[65px] justify-center"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-xs font-bold">{speedMultiplier}x</span>
          </button>
        </div>

        <div className="w-24 text-right">
          <div className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] mb-0.5">Duration</div>
          <div className="font-mono text-zinc-400 text-xs">{formatTime(maxTime)}</div>
        </div>
      </div>
    </div>
  );
}
