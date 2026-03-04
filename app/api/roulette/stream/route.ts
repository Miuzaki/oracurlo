import { NextRequest } from "next/server";

/**
 * Aviator / Crash game upstream sources.
 *
 * aviator-spribe:
 *   - WS returns JSON arrays like [{valor:"1,50x", hora:"14:30:00"}, ...]
 *
 * red-baron-evolution:
 *   - WS returns {type:"new", data:[161.46, 12.56, 1.42, ...]}
 */

const SOURCES: Record<
  string,
  { kind: "ws_aviator" | "ws_redbaron"; url: string }
> = {
  "aviator-spribe": {
    kind: "ws_aviator",
    url: "wss://history.oraculoavitor.com.br//ws",
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

/**
 * Reconstrói timestamps completos (com data) a partir de [{hora:"HH:mm:ss"}...]
 * assumindo que o array vem em ordem DESC (mais recente primeiro).
 *
 * Regra:
 * - usa "hoje" como base
 * - conforme percorre itens mais antigos, se a hora do próximo item "aumentar"
 *   em relação ao anterior (ex: 00:01 depois 23:59), cruzou meia-noite => subtrai 1 dia.
 */
function buildTimestampsFromHorasDesc(
  raw: Array<{ valor: string; hora: string }>,
  now: Date,
): Array<{ multiplier: number; date: Date }> {
  const out: Array<{ multiplier: number; date: Date }> = [];

  // baseDate = hoje (local)
  let base = new Date(now);
  base.setMilliseconds(0);

  // controle da hora anterior (em segundos do dia)
  let prevSecOfDay: number | null = null;

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]!;
    const m = parseMultiplier(item.valor);
    if (m == null) continue;

    const h = parseHora(item.hora);
    if (!h) continue;

    const secOfDay = h.hh * 3600 + h.mm * 60 + h.ss;

    // Se a hora "aumentou" indo para trás no histórico, cruzou meia-noite => volta 1 dia
    // Ex (desc): 00:00:10, 23:59:40  => secOfDay (10) -> (86380) aumentou, então -1 dia
    if (prevSecOfDay != null && secOfDay > prevSecOfDay) {
      base = new Date(base.getTime() - 24 * 60 * 60 * 1000);
      base.setMilliseconds(0);
    }
    prevSecOfDay = secOfDay;

    const d = new Date(base);
    d.setHours(h.hh, h.mm, h.ss, 0);

    // Se por algum motivo ainda ficou no futuro (clock/latência), puxa 1 dia
    // (tolerância de 2 minutos)
    if (d.getTime() > now.getTime() + 2 * 60 * 1000) {
      d.setDate(d.getDate() - 1);
    }

    out.push({ multiplier: m, date: d });
  }

  return out;
}

/**
 * ID determinístico baseado em timestamp(ms) + multiplier(centésimos).
 * Evita mudar id toda vez que o WS reenvia o histórico.
 */
function makeStableId(date: Date, multiplier: number): number {
  const ms = date.getTime();
  const mult = Math.round(multiplier * 100); // centésimos
  // hash simples dentro do range safe do JS number
  const h = (ms % 2_000_000_000) * 1000 + (mult % 1000);
  return h;
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
        } catch {
          // stream may have closed
        }
      }

      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          // ignore
        }
      }, 15000);

      function cleanup() {
        clearInterval(keepAlive);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // ignore
          }
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

              const built = buildTimestampsFromHorasDesc(raw, now);

              const results: AviatorResult[] = built.map(
                ({ multiplier, date }) => {
                  const timestamp = date.toISOString();
                  return {
                    id: makeStableId(date, multiplier),
                    multiplier,
                    timestamp,
                    destaque: multiplier >= 10,
                  };
                },
              );

              if (results.length > 0) {
                send("history", { channel_id: channelId, results });
              }
            } catch {
              // ignore parse errors
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
        } else if (source.kind === "ws_redbaron") {
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
              // ignore parse errors
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
