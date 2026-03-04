"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Activity, Plane } from "lucide-react";

export type GameBadge =
  | "ao-vivo"
  | "em-breve"
  | "novo"
  | "manutencao"
  | "desativado"
  | "principal";

const BADGE_CONFIG: Record<
  GameBadge,
  { label: string; dot: string; ping: string; text: string; bg: string }
> = {
  "ao-vivo": {
    label: "AO VIVO",
    dot: "bg-red-500",
    ping: "bg-red-400",
    text: "text-red-400",
    bg: "bg-black/60",
  },
  principal: {
    label: "PRINCIPAL",
    dot: "bg-cyan-500",
    ping: "bg-cyan-400",
    text: "text-cyan-400",
    bg: "bg-black/60",
  },
  "em-breve": {
    label: "EM BREVE",
    dot: "bg-amber-500",
    ping: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-black/60",
  },
  novo: {
    label: "NOVO",
    dot: "bg-violet-500",
    ping: "bg-violet-400",
    text: "text-violet-400",
    bg: "bg-black/60",
  },
  manutencao: {
    label: "MANUTENCAO",
    dot: "bg-red-500",
    ping: "bg-red-400",
    text: "text-red-400",
    bg: "bg-black/60",
  },
  desativado: {
    label: "DESATIVADO",
    dot: "bg-neutral-500",
    ping: "bg-neutral-400",
    text: "text-neutral-400",
    bg: "bg-black/60",
  },
};

export interface GameInfo {
  id: string;
  slug: string;
  name: string;
  provider: string;
  channelId: string;
  image: string;
  badge: GameBadge;
  icon?: React.ReactNode;
}

export const CRASH_GAMES: GameInfo[] = [
  {
    id: "spribe-aviator",
    slug: "spribe/aviator",
    name: "Aviator",
    provider: "Spribe",
    channelId: "aviator-spribe",
    image: "/images/games/aviator.jpeg",
    icon: <Plane className="h-7 w-7" />,
    badge: "ao-vivo",
  },
];

export function getMultiplierColor(m: number): string {
  if (m >= 10)
    return "bg-pink-500 text-white shadow-[0_0_12px_hsl(0_84%_50%/0.4)]";
  if (m < 2) return "bg-blue-600 text-white";
  if (m >= 2) return "bg-violet-500 text-white ring-1 ring-primary/20";
  return "bg-muted/50 text-muted-foreground";
}

export function getMultiplierRingColor(m: number): string {
  if (m >= 10) return "ring-pink-500/50";
  if (m >= 2) return "ring-violet-500/15";
  if (m >= 0) return "ring-blue-500/30";
  return "ring-border";
}

function CrashBadgeChip({ badge }: { badge: GameBadge }) {
  const cfg = BADGE_CONFIG[badge];
  const hasPing = badge === "ao-vivo";

  return (
    <div
      className={`flex items-center gap-1 rounded-full ${cfg.bg} px-2 py-0.5 backdrop-blur-sm`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {hasPing && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.ping} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.dot}`}
        />
      </span>
      <span
        className={`font-mono text-[9px] font-bold tracking-wider ${cfg.text} uppercase`}
      >
        {cfg.label}
      </span>
    </div>
  );
}

function GameInfoCard({ game }: { game: GameInfo }) {
  const isDisabled =
    game.badge === "desativado" ||
    game.badge === "manutencao" ||
    game.badge === "em-breve";

  const cardContent = (
    <Card
      className={`group relative overflow-hidden border-border/40 bg-card transition-all ${isDisabled ? "opacity-60 grayscale" : "cursor-pointer hover:border-primary/50 hover:shadow-[0_0_30px_hsl(199_89%_48%/0.12)]"}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={game.image}
          alt={game.name}
          fill
          className={`object-cover transition-transform duration-300 ${isDisabled ? "" : "group-hover:scale-105"}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-2 left-2">
          <CrashBadgeChip badge={game.badge} />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-sm font-bold text-white leading-tight text-balance">
            {game.name}
          </p>
          <p className="mt-0.5 text-[10px] text-white/60">{game.provider}</p>
        </div>

        {!isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-100 scale-75">
              <Play className="ml-0.5 h-5 w-5" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  if (isDisabled) {
    return <div className="cursor-not-allowed">{cardContent}</div>;
  }

  return <Link href={`/jogo/${game.id}`}>{cardContent}</Link>;
}

export function GameCatalog() {
  const liveCount = CRASH_GAMES.filter((g) => g.badge === "ao-vivo").length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Crash Games</h2>
        {liveCount > 0 && (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-400 border-red-500/30 px-2.5 py-0.5 text-xs font-semibold"
          >
            {liveCount} Ao Vivo
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {CRASH_GAMES.map((game) => (
          <GameInfoCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
