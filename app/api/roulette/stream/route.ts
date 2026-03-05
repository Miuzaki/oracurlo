import { NextRequest } from "next/server";

/**
 * aviator-spribe:
 *   WS returns: [{valor:"1,50x", hora:"14:30:00"}, ...]
 *
 * red-baron-evolution:
 *   WS returns: {type:"new", data:[161.46, 12.56, ...]}
 */

const SOURCES: Record<
  string,
  { kind: "ws_aviator" | "ws_redbaron"; url: string }
> = {
  "aviator-spribe": {
    kind: "ws_aviator",
    url: "wss://1652-2804-54-c100-1-5cf4-cad1-21c6-523b.ngrok-free.app/ws",
  },
  "red-baron-evolution": {
    kind: "ws_redbaron",
    url: "wss://red.codehelpers.dev",
  },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AviatorResult {
  id: number;
  multiplier: number;
  timestamp: string; // ISO
  destaque: boolean;
}

const SP_OFFSET_MINUTES = -180; // America/Sao_Paulo (hoje é -03:00)

function parseMultiplier(valor: string): number | null {
  if (!valor) return null;
  const clean = valor.replace(/x/gi, "").trim().replace(",", ".");
  const m = Number.parseFloat(clean);
  return Number.isFinite(m) ? m : null;
}

function parseHora(
  hora: string,
): { hh: number; mm: number; ss: number } | null {
  if (!hora) return null;
  const parts = hora.split(":");
  if (parts.length !== 3) return null;

  const hh = Number.parseInt(parts[0]!, 10);
  const mm = Number.parseInt(parts[1]!, 10);
  const ss = Number.parseInt(parts[2]!, 10);

  if (
    !Number.isFinite(hh) ||
    !Number.isFinite(mm) ||
    !Number.isFinite(ss) ||
    hh < 0 ||
    hh > 23 ||
    mm < 0 ||
    mm > 59 ||
    ss < 0 ||
    ss > 59
  ) {
    return null;
  }

  return { hh, mm, ss };
}

// pega "YYYY-MM-DD" em São Paulo, independente do TZ do servidor
function getSaoPauloYMD(now: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
  };
}

/**
 * Converte uma data/hora LOCAL de SP para Date real (UTC por baixo)
 * Ex: SP 15:49:50 -> UTC 18:49:50Z
 */
function makeDateFromSPLocal(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  ss: number,
): Date {
  // SP = UTC-3 => UTC = SP + 3h
  const utcMs = Date.UTC(y, m - 1, d, hh - SP_OFFSET_MINUTES / 60, mm, ss, 0);
  return new Date(utcMs);
}

function addDaysYMD(
  y: number,
  m: number,
  d: number,
  deltaDays: number,
): { y: number; m: number; d: number } {
  // faz no UTC pra não depender do TZ do servidor
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
  };
}

/**
 * Reconstrói timestamps completos assumindo raw em ordem DESC (mais recente primeiro),
 * usando "data de SP" como base e tratando virada de meia-noite.
 */
function buildTimestampsFromHorasDescSP(
  raw: Array<{ valor: string; hora: string }>,
  now: Date,
): Array<{ multiplier: number; date: Date }> {
  const out: Array<{ multiplier: number; date: Date }> = [];

  // base = "hoje em SP"
  let { y, m, d } = getSaoPauloYMD(now);

  // controle da hora anterior (segundos do dia)
  let prevSecOfDay: number | null = null;

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]!;
    const mult = parseMultiplier(item.valor);
    if (mult == null) continue;

    const h = parseHora(item.hora);
    if (!h) continue;

    const secOfDay = h.hh * 3600 + h.mm * 60 + h.ss;

    // se "voltando no histórico" a hora aumentar => cruzou meia-noite (volta 1 dia)
    if (prevSecOfDay != null && secOfDay > prevSecOfDay) {
      const back = addDaysYMD(y, m, d, -1);
      y = back.y;
      m = back.m;
      d = back.d;
    }
    prevSecOfDay = secOfDay;

    const date = makeDateFromSPLocal(y, m, d, h.hh, h.mm, h.ss);

    // proteção extra: se ainda ficar no futuro em relação ao now real, volta 1 dia
    if (date.getTime() > now.getTime() + 2 * 60 * 1000) {
      const back = addDaysYMD(y, m, d, -1);
      const fixed = makeDateFromSPLocal(
        back.y,
        back.m,
        back.d,
        h.hh,
        h.mm,
        h.ss,
      );
      out.push({ multiplier: mult, date: fixed });
      continue;
    }

    out.push({ multiplier: mult, date });
  }

  return out;
}

function makeStableId(date: Date, multiplier: number): number {
  const ms = date.getTime();
  const mult = Math.round(multiplier * 100);
  return (ms % 2_000_000_000) * 1000 + (mult % 1000);
}

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channel_id");

  if (!channelId || !SOURCES[channelId]) {
    return new Response(JSON.stringify({ error: "channel_id invalido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const source = SOURCES[channelId];
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(eventType: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        } catch {}
      }

      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {}
      }, 15000);

      function cleanup() {
        clearInterval(keepAlive);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {}
        }
      }

      try {
        const { default: WebSocket } = await import("ws");

        if (source.kind === "ws_aviator") {
          const ws = new WebSocket(source.url);

          ws.on("open", () => {
            send("connected", { channel_id: channelId, status: "connected" });
          });

          ws.on("message", (rawMsg: Buffer | string) => {
            try {
              const raw: Array<{ valor: string; hora: string }> = JSON.parse(
                rawMsg.toString(),
              );
              if (!Array.isArray(raw) || raw.length === 0) return;

              const now = new Date();
              const built = buildTimestampsFromHorasDescSP(raw, now);

              const results: AviatorResult[] = built.map(
                ({ multiplier, date }) => ({
                  id: makeStableId(date, multiplier),
                  multiplier,
                  timestamp: date.toISOString(), // agora representa o instante correto (SP -> UTC)
                  destaque: multiplier >= 10,
                }),
              );

              if (results.length > 0) {
                send("history", { channel_id: channelId, results });
              }
            } catch {
              // ignore
            }
          });

          ws.on("error", () => {
            send("error", { message: "upstream connection error" });
          });

          ws.on("close", () => {
            send("disconnected", { message: "upstream disconnected" });
            cleanup();
          });

          req.signal.addEventListener("abort", () => {
            try {
              ws.close();
            } catch {}
            cleanup();
          });
        } else {
          // ws_redbaron
          const ws = new WebSocket(source.url);

          ws.on("open", () => {
            send("connected", { channel_id: channelId, status: "connected" });
          });

          ws.on("message", (rawMsg: Buffer | string) => {
            try {
              const parsed = JSON.parse(rawMsg.toString());
              if (parsed.type === "new" && Array.isArray(parsed.data)) {
                const now = new Date();
                const results: AviatorResult[] = [];

                for (let i = 0; i < parsed.data.length; i++) {
                  const m = Number.parseFloat(parsed.data[i]);
                  if (!Number.isFinite(m)) continue;

                  const date = new Date(now.getTime() - i * 30000);
                  date.setMilliseconds(0);

                  results.push({
                    id: makeStableId(date, m),
                    multiplier: m,
                    timestamp: date.toISOString(),
                    destaque: m >= 10,
                  });
                }

                if (results.length > 0) {
                  send("history", { channel_id: channelId, results });
                }
              }
            } catch {
              // ignore
            }
          });

          ws.on("error", () => {
            send("error", { message: "upstream connection error" });
          });

          ws.on("close", () => {
            send("disconnected", { message: "upstream disconnected" });
            cleanup();
          });

          req.signal.addEventListener("abort", () => {
            try {
              ws.close();
            } catch {}
            cleanup();
          });
        }
      } catch {
        send("error", { message: "failed to connect to upstream" });
        cleanup();
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
