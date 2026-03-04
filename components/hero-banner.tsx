"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/login-modal";
import { Eye, Zap, Activity, Plane, Rocket } from "lucide-react";

const DEMO_MULTIPLIERS = [
  1.23, 3.45, 1.01, 12.5, 2.78, 1.56, 7.89, 1.12, 4.67, 1.34, 22.1, 1.89, 3.21,
  1.05, 6.43, 2.11, 1.78, 15.3, 1.45, 2.99,
];

function getColor(m: number): string {
  if (m >= 10)
    return "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(0_84%_50%/0.4)]";
  if (m >= 5) return "bg-primary/60 text-foreground";
  if (m >= 2) return "bg-muted text-foreground ring-1 ring-primary/20";
  return "bg-muted/50 text-muted-foreground";
}

export function HeroBanner() {
  const { isAuthenticated } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden bg-background">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid opacity-50" />

        {/* Red radial glow from top */}
        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/8 blur-[120px]" />

        {/* Scanline-like horizontal lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-0 w-full glow-line opacity-40" />
          <div className="absolute top-[60%] left-0 w-full glow-line opacity-20" />
          <div className="absolute top-[85%] left-0 w-full glow-line opacity-10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-28">
          <div className="flex flex-col items-center gap-10 text-center lg:flex-row lg:text-left lg:gap-16">
            {/* Text content */}
            <div className="flex flex-1 flex-col gap-6 animate-fade-up">
              {/* Status badge */}
              <div className="mx-auto flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                  Transmissao Ao Vivo
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                <span className="block">O Oraculo do</span>
                <span className="block bg-gradient-to-r from-primary via-red-400 to-primary bg-clip-text text-transparent animate-text-shimmer">
                  Aviator
                </span>
              </h1>

              <p className="max-w-xl text-muted-foreground leading-relaxed text-pretty text-lg">
                Acompanhe multiplicadores em tempo real do Aviator. Detecte
                padroes, analise sequencias e gerencie sua banca com o poder do
                Oraculo.
              </p>

              {!isAuthenticated && (
                <div className="flex justify-center gap-3 lg:justify-start">
                  <Button
                    onClick={() => setLoginOpen(true)}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(0_84%_50%/0.4)] transition-shadow hover:shadow-[0_0_40px_hsl(0_84%_50%/0.6)]"
                  >
                    <Zap className="h-5 w-5" />
                    Acessar o Oraculo
                  </Button>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center justify-center gap-8 pt-2 lg:justify-start">
                <div className="flex flex-col items-center gap-1 lg:items-start">
                  <span className="font-mono text-2xl font-bold text-foreground">
                    1
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Jogo Ao Vivo
                  </span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col items-center gap-1 lg:items-start">
                  <span className="font-mono text-2xl font-bold text-foreground">
                    24/7
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Monitoramento
                  </span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col items-center gap-1 lg:items-start">
                  <span className="font-mono text-2xl font-bold text-primary">
                    LIVE
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Tempo Real
                  </span>
                </div>
              </div>
            </div>

            {/* Oracle eye + multiplier preview */}
            <div
              className="relative flex w-full max-w-sm flex-col gap-4 lg:max-w-xs animate-slide-in-right"
              style={{ animationDelay: "0.2s", opacity: 0 }}
            >
              {/* Oracle Eye visualization */}
              <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-primary/20" />
                <div className="absolute inset-2 rounded-full border border-primary/10" />
                {/* Radar sweep */}
                <div className="absolute inset-0 animate-radar-sweep origin-center">
                  <div className="absolute top-1/2 left-1/2 h-px w-1/2 bg-gradient-to-r from-primary/60 to-transparent origin-left" />
                </div>
                {/* Center eye */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/30 animate-pulse-glow">
                  <Eye className="h-10 w-10 text-primary" />
                </div>
                {/* Orbiting icons */}
                <div
                  className="absolute top-2 right-6 animate-float"
                  style={{ animationDelay: "0s" }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-primary/20">
                    <Plane className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div
                  className="absolute bottom-4 left-4 animate-float"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-primary/20">
                    <Rocket className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>

              {/* Multiplier preview card */}
              <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                      Histórico de velas
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <span className="font-mono text-[10px] font-bold text-primary">
                      LIVE
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_MULTIPLIERS.map((m, i) => (
                    <div
                      key={i}
                      className={`flex h-7 items-center justify-center rounded px-2 font-mono text-[11px] font-bold ${getColor(m)}`}
                    >
                      {m.toFixed(2)}x
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 border-t border-border/50 pt-2 font-mono text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-muted/50" />
                    <span>{"<"}2x</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-muted ring-1 ring-primary/20" />
                    <span>2-5x</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-primary/60" />
                    <span>5-10x</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-primary" />
                    <span>10x+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom separator glow */}
        <div className="glow-line" />
      </section>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
