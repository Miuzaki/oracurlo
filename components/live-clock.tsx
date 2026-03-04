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
    <div className="group relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 transition-all duration-300 hover:border-primary/40 hover:bg-primary/10">
      {/* Glow sutil */}
      <div className="absolute inset-0 rounded-full bg-primary/5 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />

      <Clock className="relative h-3.5 w-3.5 text-primary/70 transition-colors duration-300 group-hover:text-primary" />

      <div className="relative flex items-center gap-0.5">
        <span className="font-mono text-[11px] font-bold tabular-nums tracking-wider text-foreground">
          {hours}
        </span>
        <span className="animate-pulse font-mono text-[11px] font-bold text-primary">
          {":"}
        </span>
        <span className="font-mono text-[11px] font-bold tabular-nums tracking-wider text-foreground">
          {minutes}
        </span>
        <span className="animate-pulse font-mono text-[11px] font-bold text-primary">
          {":"}
        </span>
        <span className="font-mono text-[11px] font-bold tabular-nums tracking-wider text-primary/80">
          {seconds}
        </span>
      </div>
    </div>
  );
}
