"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          --:--:--
        </span>
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  return (
    <div className="group relative flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 transition-all duration-300 hover:border-emerald-500/60 hover:bg-emerald-500/30">
      {/* Glow sutil */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />

      <Clock className="relative h-6 w-6 text-emerald-500/80 transition-colors duration-300 group-hover:text-emerald-500" />

      <div className="relative flex items-center gap-0.5">
        <span className="font-mono text-[15px] font-bold tabular-nums tracking-wider text-foreground">
          {hours}
        </span>
        <span className="animate-pulse font-mono text-[15px] font-bold text-emerald-500">
          {":"}
        </span>
        <span className="font-mono text-[15px] font-bold tabular-nums tracking-wider text-foreground">
          {minutes}
        </span>
        <span className="animate-pulse font-mono text-[15px] font-bold text-emerald-500">
          {":"}
        </span>
        <span className="font-mono text-[15px] font-bold tabular-nums tracking-wider text-emerald-500">
          {seconds}
        </span>
      </div>
    </div>
  );
}
