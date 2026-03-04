"use client";

import { useParams } from "next/navigation";
import { useCallback, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  CRASH_GAMES as GAMES,
  getMultiplierColor,
  getMultiplierRingColor,
} from "@/components/game-catalog";
import {
  useAviatorStream,
  type AviatorResult,
} from "@/hooks/use-roulette-stream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginModal } from "@/components/login-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Play,
  X,
  Maximize2,
  Minimize2,
  ArrowLeft,
  LogIn,
  Eye,
  Activity,
  Wifi,
  WifiOff,
  Target,
  Clock3,
  Sparkles,
  Filter,
  AlertTriangle,
  MousePointerClick,
  Eraser,
} from "lucide-react";

/* =========================================================
 * Tipos / Utils
 * =======================================================*/

type StrategyMode = "default" | "minutagem10" | "roxas";
type MultiplierFilter = "all" | "5x" | "10x" | "50x" | "100x" | "1000x";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHHMM(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatHHMMSS(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
    date.getSeconds(),
  )}`;
}

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minuteDiffAbs(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / 60_000;
}

function applyMultiplierFilter(
  results: AviatorResult[],
  filter: MultiplierFilter,
): AviatorResult[] {
  switch (filter) {
    case "5x":
      return results.filter((r) => r.multiplier >= 5 && r.multiplier < 10);
    case "10x":
      return results.filter((r) => r.multiplier >= 10);
    case "50x":
      return results.filter((r) => r.multiplier >= 50);
    case "100x":
      return results.filter((r) => r.multiplier >= 100);
    case "1000x":
      return results.filter((r) => r.multiplier >= 1000);
    case "all":
    default:
      return results;
  }
}

function isBlue(r: AviatorResult) {
  return r.multiplier < 1.5;
}

function isPurple(r: AviatorResult) {
  return r.multiplier >= 2;
}

function isPink(r: AviatorResult) {
  return r.multiplier >= 10;
}

/* =========================================================
 * Multiplier Square
 * =======================================================*/

function MultiplierSquare({
  result,
  size = "md",
  selected = false,
  onToggleSelect,
}: {
  result: AviatorResult;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}) {
  const colorClass = getMultiplierColor(result.multiplier);

  const sizeClass =
    size === "sm"
      ? "h-10 w-[78px] text-xs"
      : size === "lg"
        ? "h-24 w-[110px] text-xl"
        : "h-14 w-[92px] text-sm";

  const timeTextClass =
    size === "lg"
      ? "text-[11px]"
      : size === "sm"
        ? "text-[9px]"
        : "text-[10px]";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggleSelect?.(result.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleSelect?.(result.id);
        }
      }}
      style={
        selected
          ? {
              outline: "3px solid #fb923c",
              outlineOffset: "2px",
              transform: "scale(1.05)",
              filter: "brightness(1.1)",
            }
          : undefined
      }
      className={[
        "shrink-0 rounded font-mono font-bold transition-all",
        "flex flex-col items-center justify-center",
        "leading-none whitespace-nowrap tabular-nums",
        "cursor-pointer hover:scale-105 hover:brightness-110",
        sizeClass,
        colorClass,
      ].join(" ")}
    >
      <span className="tabular-nums">{result.multiplier.toFixed(2)}x</span>

      {result.timestamp && (
        <span className={`mt-1 opacity-90 ${timeTextClass}`}>
          {formatHHMM(new Date(result.timestamp))}
        </span>
      )}
    </div>
  );
}

/* =========================================================
 * Bloco fixo acima dos filtros (métricas do dia)
 * =======================================================*/

function DayMetricsBlock({ results }: { results: AviatorResult[] }) {
  const data = useMemo(() => {
    const now = new Date();
    const today = results.filter((r) =>
      isSameLocalDay(new Date(r.timestamp), now),
    );

    const rosas = today.filter((r) => r.multiplier >= 10);
    const totalHoje = today.length;

    const somaRosas = rosas.reduce((acc, r) => acc + r.multiplier, 0);
    const mediaRosas = rosas.length > 0 ? somaRosas / rosas.length : 0;
    const maiorRosa = rosas.reduce((max, r) => Math.max(max, r.multiplier), 0);

    return {
      totalHoje,
      qtdRosas: rosas.length,
      mediaRosas,
      maiorRosa,
    };
  }, [results]);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-border/50 bg-background/40 p-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Média das Rosas do Dia
        </div>
        <div className="mt-1 font-mono text-lg font-bold text-foreground">
          {data.qtdRosas > 0 ? `${data.mediaRosas.toFixed(2)}x` : "--"}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Considera apenas velas ≥ 10x de hoje
        </p>
      </div>

      <div className="rounded-lg border border-border/50 bg-background/40 p-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Maior Rosa do Dia
        </div>
        <div className="mt-1 font-mono text-lg font-bold text-primary">
          {data.qtdRosas > 0 ? `${data.maiorRosa.toFixed(2)}x` : "--"}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Atualização automática em tempo real
        </p>
      </div>

      <div className="rounded-lg border border-border/50 bg-background/40 p-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Total de Velas Hoje
        </div>
        <div className="mt-1 font-mono text-lg font-bold text-foreground">
          {data.totalHoje}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Reset diário automático (00:00)
        </p>
      </div>
    </div>
  );
}

/* =========================================================
 * Filtros de multiplicador (corretos)
 * =======================================================*/

function MultiplierFilters({
  filter,
  onChange,
}: {
  filter: MultiplierFilter;
  onChange: (f: MultiplierFilter) => void;
}) {
  const items: Array<{ key: MultiplierFilter; label: string }> = [
    { key: "all", label: "Todas" },
    { key: "5x", label: "5x" },
    { key: "10x", label: "10x" },
    { key: "50x", label: "50x" },
    { key: "100x", label: "100x" },
    { key: "1000x", label: "1000x" },
  ];

  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filtros de Multiplicador
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = filter === item.key;
          return (
            <Button
              key={item.key}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(item.key)}
              className={`font-mono text-xs ${active ? "" : "border-border/50"}`}
            >
              {item.label}
            </Button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        5x = 5.00x até 9.99x • 10x = ≥10.00x • 50x = ≥50x • 100x = ≥100x • 1000x
        = ≥1000x
      </p>
    </div>
  );
}

/* =========================================================
 * Estratégia Minutagem 10
 * =======================================================*/

type ActiveMinutagemProjection = {
  sourceId: number;
  sourceMultiplier: number;
  sourceTime: string;
  sourceDate: Date;
  targetDate: Date;
  windowStart: Date;
  windowEnd: Date;
  targetCenterLabel: string;
  targetWindowLabel: string;
};

function StrategyMinutagem10Panel({ results }: { results: AviatorResult[] }) {
  const nowTick = Date.now();

  const data = useMemo(() => {
    const orderedDesc = [...results].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const last50 = orderedDesc.slice(0, 50);
    const rosas50 = last50.filter(isPink);
    const patternActive = rosas50.length >= 3;

    let activeProjections: ActiveMinutagemProjection[] = [];

    if (patternActive) {
      const rosasAsc = [...rosas50].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      activeProjections = rosasAsc
        .map((r) => {
          const sourceDate = new Date(r.timestamp);
          const targetDate = addMinutes(sourceDate, 10);
          const windowStart = addMinutes(targetDate, -1);
          const windowEnd = addMinutes(targetDate, 1);

          return {
            sourceId: r.id,
            sourceMultiplier: r.multiplier,
            sourceTime: formatHHMMSS(sourceDate),
            sourceDate,
            targetDate,
            windowStart,
            windowEnd,
            targetCenterLabel: formatHHMM(targetDate),
            targetWindowLabel: `${formatHHMM(windowStart)} / ${formatHHMM(
              targetDate,
            )} / ${formatHHMM(windowEnd)}`,
          };
        })
        .filter((p) => nowTick <= p.windowEnd.getTime())
        .reduce<ActiveMinutagemProjection[]>((acc, p) => {
          const already = acc.find(
            (x) => x.targetDate.getTime() === p.targetDate.getTime(),
          );
          if (!already) acc.push(p);
          return acc;
        }, [])
        .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
    }

    const nextProjection = activeProjections.find(
      (p) => p.windowEnd.getTime() >= nowTick,
    );

    const matchesInWindow = (p: ActiveMinutagemProjection) => {
      return orderedDesc.some((r) => {
        if (r.id === p.sourceId) return false;
        if (!isPink(r)) return false;
        const t = new Date(r.timestamp);
        return t >= p.windowStart && t <= p.windowEnd;
      });
    };

    const projectionsWithHit = activeProjections.map((p) => ({
      ...p,
      hit: matchesInWindow(p),
    }));

    return {
      patternActive,
      totalLast50: last50.length,
      rosasCountLast50: rosas50.length,
      activeCount: activeProjections.length,
      nextProjection,
      projections: projectionsWithHit,
    };
  }, [results, nowTick]);

  return (
    <div className="flex flex-col gap-4">
      {!data.patternActive ? (
        <div className="rounded-lg border border-border/50 bg-background/40 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Estratégia de Minutagem (10 min)
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Padrão ainda não ativado. Nas últimas 50 velas há{" "}
            <span className="font-mono font-bold text-foreground">
              {data.rosasCountLast50}
            </span>{" "}
            vela(s) rosa(s). É necessário <b>3 ou mais</b> para gerar sinais.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                Próxima vela mais recente (entrada)
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="rounded border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-lg font-bold text-primary">
                {data.nextProjection
                  ? data.nextProjection.targetCenterLabel
                  : "Sem próxima janela ativa"}
              </span>

              {data.nextProjection && (
                <span className="font-mono text-xs text-muted-foreground">
                  Janela: {data.nextProjection.targetWindowLabel}
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Mostra a próxima entrada do padrão de 10 minutos com tolerância de
              1 minuto antes/depois.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Qtd. velas no padrão
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {data.activeCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Projeções ativas (não expiradas)
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Rosas nas últimas 50
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {data.rosasCountLast50}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Condição de ativação: ≥ 3 rosas
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Base analisada
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {data.totalLast50}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Últimas 50 velas (janela móvel)
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 p-3">
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Horários de entrada do padrão (10 min ±1)
            </div>

            {data.projections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há horários ativos no momento (as janelas anteriores já
                expiraram).
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.projections.map((p) => (
                  <div
                    key={`${p.sourceId}-${p.targetDate.getTime()}`}
                    className="flex flex-col gap-1 rounded-md border border-border/40 bg-background/30 px-3 py-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="font-mono text-xs text-foreground">
                      Rosa em{" "}
                      <span className="text-primary font-bold">
                        {p.sourceTime}
                      </span>{" "}
                      <span className="text-emerald-500">
                        ({p.sourceMultiplier.toFixed(2)}x) → entrada{" "}
                      </span>
                      <span className="text-emerald-500 font-bold">
                        {p.targetCenterLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="rounded border border-border/50 px-2 py-0.5 text-muted-foreground">
                        {p.targetWindowLabel}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 ${
                          // @ts-ignore
                          p.hit
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : "border border-border/50 text-muted-foreground"
                        }`}
                      >
                        {/* @ts-ignore */}
                        {p.hit ? "hit no histórico" : "aguardando / sem hit"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
 * Estratégia Velas Roxas
 * =======================================================*/

type SequenceInfo = {
  startIndex: number;
  endIndex: number;
  length: number;
};

function findPurpleSequentialOccurrences(last30Desc: AviatorResult[]) {
  const asc = [...last30Desc].reverse();

  const sequences: SequenceInfo[] = [];
  let start = -1;

  for (let i = 0; i < asc.length; i++) {
    if (isPurple(asc[i])) {
      if (start === -1) start = i;
    } else {
      if (start !== -1) {
        const length = i - start;
        if (length >= 2) {
          sequences.push({ startIndex: start, endIndex: i - 1, length });
        }
        start = -1;
      }
    }
  }

  if (start !== -1) {
    const length = asc.length - start;
    if (length >= 2) {
      sequences.push({
        startIndex: start,
        endIndex: asc.length - 1,
        length,
      });
    }
  }

  return sequences;
}

function getMaxBlueStreak(last30Desc: AviatorResult[]) {
  const asc = [...last30Desc].reverse();
  let current = 0;
  let max = 0;

  for (const r of asc) {
    if (isBlue(r)) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }

  return max;
}

function StrategyVelasRoxasPanel({
  results,
  selectedCandles,
  onToggleSelect,
}: {
  results: AviatorResult[];
  selectedCandles?: Set<number>;
  onToggleSelect?: (id: number) => void;
}) {
  const data = useMemo(() => {
    const orderedDesc = [...results].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const last30 = orderedDesc.slice(0, 30);
    const sequences = findPurpleSequentialOccurrences(last30);
    const purpleSequenceOccurrences = sequences.length;

    const maxBlueStreak = getMaxBlueStreak(last30);
    const blocked = maxBlueStreak >= 3;

    const validBase = purpleSequenceOccurrences >= 1;
    const patternValid = validBase && !blocked;

    const latestCandle = orderedDesc[0] ?? null;
    const triggerNow = Boolean(
      patternValid && latestCandle && latestCandle.multiplier >= 2,
    );

    return {
      last30,
      sequences,
      purpleSequenceOccurrences,
      maxBlueStreak,
      blocked,
      validBase,
      patternValid,
      latestCandle,
      triggerNow,
    };
  }, [results]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-lg border p-4 ${
          data.patternValid
            ? "border-emerald-500/30 bg-emerald-500/50"
            : "border-border/50 bg-background/40"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles
            className={`h-4 w-4 ${
              data.patternValid ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Padrão de Vela Roxa (30 velas)
          </span>
        </div>

        {!data.validBase ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Ainda não há sequência válida de velas roxas (≥2x) dentro das
            últimas 30 velas. É necessário ter pelo menos{" "}
            <b>1 ocorrência de sequência</b> (2 ou mais roxas consecutivas).
          </p>
        ) : data.blocked ? (
          <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Aguardar sair uma vela roxa e fazer entrada.
          </div>
        ) : (
          <div className="mt-2 rounded-md border border-emerald-500/60 bg-emerald-500/65 px-3 py-2 text-sm">
            Padrão válido para operar vela roxa.
          </div>
        )}

        {data.triggerNow && (
          <div className="mt-2 rounded-md border border-emerald-500/60 bg-emerald-500/65 px-3 py-2 font-mono text-xs">
            Sinal de entrada imediato: saiu vela roxa ≥ 2x agora.
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Sequências roxas
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {data.purpleSequenceOccurrences}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ocorrências de 2+ roxas consecutivas nas últimas 30
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Máx. azuis consecutivas
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {data.maxBlueStreak}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Bloqueia padrão se chegar em 3+
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Status do padrão
          </div>
          <div
            className={`mt-1 font-mono text-sm font-bold ${
              data.patternValid ? "text-emerald-500" : "text-primary"
            }`}
          >
            {data.patternValid
              ? "Válido, Padrão pronto para operar"
              : "Padrão ruim no momento, aguarde melhora do gráfico"}
          </div>
          <p className="mt-1 text-xs text-emerald-500">
            Entrar após uma vela roxa ≥ 2x com padrão válido
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 p-3">
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Leitura rápida (últimas 30 velas)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.last30.map((r) => (
            <MultiplierSquare
              key={`roxas-${r.id}-${r.timestamp}`}
              result={r}
              size="md"
              selected={selectedCandles?.has(r.id) ?? false}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Primeira entrada (principal)
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-foreground">
            Maior valor - proteção no 1,5X
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Segunda entrada (alavancagem)
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-foreground">
            Menor valor - saida entre 2X a 5X
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * Page
 * =======================================================*/

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const { isAuthenticated } = useAuth();

  const [loginOpen, setLoginOpen] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [strategyMode, setStrategyMode] = useState<StrategyMode>("default");
  const [multiplierFilter, setMultiplierFilter] =
    useState<MultiplierFilter>("all");

  const [selectedCandles, setSelectedCandles] = useState<Set<number>>(
    new Set(),
  );

  const toggleCandleSelection = useCallback((id: number) => {
    setSelectedCandles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCandles(new Set());
  }, []);

  const game = useMemo(() => {
    return GAMES.find((g) => g.slug.replace("/", "-") === gameId);
  }, [gameId]);

  const { results, connected } = useAviatorStream(game?.channelId ?? null);

  const isAviatorStrategiesAvailable = game?.channelId === "aviator-spribe";

  useEffect(() => {
    if (!isAviatorStrategiesAvailable && strategyMode !== "default") {
      setStrategyMode("default");
    }
  }, [isAviatorStrategiesAvailable, strategyMode]);

  // ✅ trava scroll quando fullscreen (e destrava ao sair)
  useEffect(() => {
    if (!isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

  const startGame = useCallback(async () => {
    if (!game) return;

    try {
      setLoading(true);
      setError(null);

      const isMobile = /iPhone|iPad|Android|Mobile/.test(navigator.userAgent);
      const platform = isMobile ? "MOBILE" : "WEB";

      const res = await fetch(
        `/api/games/start?slug=${encodeURIComponent(
          game.slug,
        )}&platform=${platform}&use_demo=1`,
      );

      const rawText = await res.text();

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        setError("Resposta invalida do servidor");
        return;
      }

      if (!data.success) {
        setError(data.message || "Erro ao iniciar jogo");
        return;
      }

      const url =
        data.data?.url ||
        data.data?.game_url ||
        data.data?.data?.url ||
        data.data?.data?.game_url ||
        data.data?.launch_url ||
        data.data?.data?.launch_url;

      if (!url) {
        setError("URL do jogo nao encontrada");
        return;
      }

      setGameUrl(url);
    } catch {
      setError("Erro de conexao");
    } finally {
      setLoading(false);
    }
  }, [game]);

  const filteredResults = useMemo(() => {
    return applyMultiplierFilter(results, multiplierFilter);
  }, [results, multiplierFilter]);

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col bg-background noise-overlay">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-2xl font-bold text-foreground">
            Jogo nao encontrado
          </h1>
          <Link href="/">
            <Button variant="outline" className="border-border text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao inicio
            </Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background noise-overlay">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground uppercase tracking-wider transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          {/* Header do jogo */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-primary/20" />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {game.icon}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide">
                {game.name}
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  {game.provider}
                </span>
                <div className="h-3 w-px bg-border" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  Crash
                </span>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1">
                  {connected ? (
                    <>
                      <Wifi className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                        Ao Vivo
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        Conectando...
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Área do jogo (✅ iframe único; fullscreen só por CSS) */}
          {gameUrl ? (
            <div className="mb-8 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Jogando agora
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Tela Cheia
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setGameUrl(null);
                      setIsFullscreen(false);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    Fechar
                  </Button>
                </div>
              </div>

              <div
                className={
                  isFullscreen
                    ? "fixed inset-0 z-[60] bg-background"
                    : "relative w-full overflow-hidden rounded-lg border border-border/50 " +
                      "aspect-[9/16] max-h-[78vh] sm:max-h-none sm:aspect-video"
                }
              >
                {isFullscreen && (
                  <div className="absolute left-0 right-0 top-0 z-[61] flex items-center justify-between border-b border-border/50 bg-card/95 px-4 py-2 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      <span className="font-mono text-sm font-bold text-foreground uppercase">
                        {game.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {game.provider}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGameUrl(null);
                          setIsFullscreen(false);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                        Fechar
                      </Button>
                    </div>
                  </div>
                )}

                <iframe
                  src={gameUrl}
                  className={
                    isFullscreen
                      ? "absolute inset-0 h-full w-full pt-[49px]"
                      : "absolute inset-0 h-full w-full"
                  }
                  title={game.name}
                  allow="fullscreen; autoplay; encrypted-media"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox"
                />
              </div>
            </div>
          ) : (
            <Card className="mb-8 border-border/50 bg-card">
              <CardContent className="flex flex-col items-center justify-center gap-5 py-16">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 animate-pulse rounded-full border border-primary/20" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {game.icon}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
                    {error}
                  </div>
                )}

                {isAuthenticated ? (
                  <Button
                    onClick={startGame}
                    disabled={loading}
                    size="lg"
                    className="bg-primary text-primary-foreground shadow-[0_0_25px_hsl(0_84%_50%/0.4)] hover:bg-primary/90"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                    {loading ? "Carregando..." : "Jogar Agora"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setLoginOpen(true)}
                    size="lg"
                    className="bg-primary text-primary-foreground shadow-[0_0_25px_hsl(0_84%_50%/0.4)] hover:bg-primary/90"
                  >
                    <LogIn className="h-5 w-5" />
                    Entrar para Jogar
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 uppercase tracking-wide text-foreground">
                    <Activity className="h-5 w-5 text-primary" />
                    Historico em Tempo Real
                    {connected && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                      </span>
                    )}
                  </CardTitle>
                </div>

                {/* Select de estratégia */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Modo de visualização
                  </div>

                  <div className="w-full sm:w-[340px]">
                    <Select
                      value={strategyMode}
                      onValueChange={(v) => setStrategyMode(v as StrategyMode)}
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue placeholder="Selecionar modo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Padrão (Último + Anteriores)
                        </SelectItem>

                        {isAviatorStrategiesAvailable && (
                          <>
                            <SelectItem value="minutagem10">
                              Estratégia de minutagem (10 min)
                            </SelectItem>
                            <SelectItem value="roxas">
                              Estratégia de velas roxas
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedCandles.size > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-orange-400/30 bg-orange-400/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-orange-400" />
                      <span className="rounded-full bg-orange-400/20 px-2 py-0.5 font-mono text-[10px] font-bold text-orange-400">
                        {selectedCandles.size} vela
                        {selectedCandles.size > 1 ? "s" : ""} selecionada
                        {selectedCandles.size > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="font-mono text-xs border-orange-400/30 text-orange-400 hover:bg-orange-400/10 hover:text-orange-300"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                      Limpar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  {connected ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                        Aguardando resultados...
                      </p>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-6 w-6 text-muted-foreground" />
                      <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                        Conectando ao servidor...
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {strategyMode === "default" ||
                  !isAviatorStrategiesAvailable ? (
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Ultimo
                        </span>
                        <div
                          className={`rounded-lg ring-2 ${getMultiplierRingColor(
                            results[0].multiplier,
                          )}`}
                        >
                          <MultiplierSquare
                            result={results[0]}
                            size="lg"
                            selected={selectedCandles.has(results[0].id)}
                            onToggleSelect={toggleCandleSelection}
                          />
                        </div>
                      </div>

                      <div className="h-14 w-px bg-border/50" />

                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Anteriores
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {results.slice(1, 16).map((r) => (
                            <MultiplierSquare
                              key={`${r.id}-${r.timestamp}`}
                              result={r}
                              size="md"
                              selected={selectedCandles.has(r.id)}
                              onToggleSelect={toggleCandleSelection}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : strategyMode === "minutagem10" ? (
                    <StrategyMinutagem10Panel results={results} />
                  ) : (
                    <StrategyVelasRoxasPanel
                      results={results}
                      selectedCandles={selectedCandles}
                      onToggleSelect={toggleCandleSelection}
                    />
                  )}

                  <div className="border-t border-border/50 pt-4">
                    <DayMetricsBlock results={results} />
                  </div>

                  <MultiplierFilters
                    filter={multiplierFilter}
                    onChange={setMultiplierFilter}
                  />

                  <div className="border-t border-border/50 pt-4">
                    <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Todas as rodadas ({filteredResults.length}){" "}
                      {multiplierFilter !== "all" &&
                        `(filtro: ${multiplierFilter})`}
                    </span>

                    {filteredResults.length === 0 ? (
                      <div className="rounded-lg border border-border/50 bg-background/30 px-4 py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          Nenhuma vela encontrada para o filtro selecionado.
                        </p>
                      </div>
                    ) : (
                      <div className="grid items-center justify-items-center grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                        {filteredResults.map((r) => (
                          <MultiplierSquare
                            key={`all-${r.id}-${r.timestamp}`}
                            result={r}
                            size="md"
                            selected={selectedCandles.has(r.id)}
                            onToggleSelect={toggleCandleSelection}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t border-border/50 pt-3 font-mono text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-sm bg-muted/50" />
                      <span>{"<"} 2.00x</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-sm bg-muted ring-1 ring-primary/20" />
                      <span>2.00x - 4.99x</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
                      <span>5.00x - 9.99x</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                      <span>10.00x+</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
