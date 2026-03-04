import { NextRequest } from "next/server";

/**
 * Aviator / Crash game upstream sources.
 *
 * aviator-spribe:
 *   - WebSocket at ws://100.81.79.127:8805/ws
 *     Returns JSON arrays like [{valor:"1.50x", hora:"14:30:00"}, ...]
 *
 * red-baron-evolution:
 *   - WebSocket at wss://red.codehelpers.dev
 *     Returns {type:"new", data:[161.46, 12.56, 1.42, ...]}
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
  timestamp: string;
  destaque: boolean;
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
        if (source.kind === "ws_aviator") {
          // Connect to upstream WS
          const { default: WebSocket } = await import("ws");
          const ws = new WebSocket(source.url);

          let lastId = 0;

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
              const results: AviatorResult[] = [];

              for (let i = 0; i < raw.length; i++) {
                const item = raw[i];
                const val = item.valor?.replace("x", "")?.replace(",", ".");
                const m = parseFloat(val);
                if (isNaN(m)) continue;

                lastId++;

                let timestamp = now.toISOString();
                if (item.hora) {
                  const parts = item.hora.split(":");
                  if (parts.length === 3) {
                    const d = new Date(now);
                    d.setHours(
                      parseInt(parts[0], 10),
                      parseInt(parts[1], 10),
                      parseInt(parts[2], 10),
                      0,
                    );
                    timestamp = d.toISOString();
                  }
                }

                results.push({
                  id: lastId,
                  multiplier: m,
                  timestamp,
                  destaque: m >= 10,
                });
              }

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

          // Clean up when client disconnects
          req.signal.addEventListener("abort", () => {
            ws.close();
            cleanup();
          });
        } else if (source.kind === "ws_redbaron") {
          // Connect to Red Baron upstream WSS
          const { default: WebSocket } = await import("ws");
          const ws = new WebSocket(source.url);

          let globalId = 0;

          ws.on("open", () => {
            send("connected", { channel_id: channelId, status: "connected" });
          });

          ws.on("message", (rawMsg: Buffer | string) => {
            try {
              const parsed = JSON.parse(rawMsg.toString());

              // Red Baron sends {type:"new", data:[161.46, 12.56, ...]}
              if (parsed.type === "new" && Array.isArray(parsed.data)) {
                const now = new Date();
                const results: AviatorResult[] = [];

                for (let i = 0; i < parsed.data.length; i++) {
                  const m = parseFloat(parsed.data[i]);
                  if (isNaN(m)) continue;
                  globalId++;
                  results.push({
                    id: globalId,
                    multiplier: m,
                    timestamp: new Date(
                      now.getTime() - i * 30000,
                    ).toISOString(),
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
            ws.close();
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
