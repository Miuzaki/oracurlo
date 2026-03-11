import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GO_WS_BASE =
  process.env.GO_WS_BASE_URL?.trim() ||
  "wss://ws-historylab.codehelpers.dev/ws";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account")?.trim();
  const game = req.nextUrl.searchParams.get("game")?.trim();

  console.log("[bacbo-stream] GET request", { account, game });

  if (!account || !game) {
    console.warn("[bacbo-stream] Missing required parameters");
    return new Response(
      JSON.stringify({ error: "parâmetros obrigatórios: account e game" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const encoder = new TextEncoder();
  let upstreamWs: import("ws").WebSocket | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (eventType: string, data: unknown) => {
        if (closed) {
          console.log(`[bacbo-stream] Skipping send (closed): ${eventType}`);
          return;
        }
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
          console.log(`[bacbo-stream] Sent event: ${eventType}`, data);
        } catch (error) {
          console.error(`[bacbo-stream] Error sending ${eventType}:`, error);
        }
      };

      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch (error) {
          console.error("[bacbo-stream] Keep-alive error:", error);
        }
      }, 15000);

      try {
        console.log("[bacbo-stream] Importing WebSocket module...");
        const { default: WebSocket } = await import("ws");

        const wsUrl = new URL(GO_WS_BASE);
        wsUrl.searchParams.set("account", account);
        wsUrl.searchParams.set("game", game);

        console.log(
          "[bacbo-stream] Connecting to upstream WS:",
          wsUrl.toString(),
        );
        upstreamWs = new WebSocket(wsUrl.toString());

        upstreamWs.on("open", () => {
          console.log("[bacbo-stream] WebSocket connected");
          send("connected", {
            status: "connected",
            account,
            game,
            upstream: wsUrl.toString(),
          });
        });

        upstreamWs.on("message", (rawMsg: Buffer | string) => {
          try {
            const msg = JSON.parse(rawMsg.toString());
            const eventType =
              typeof msg?.event === "string" ? msg.event : "message";

            console.log(
              `[bacbo-stream] Message received (${eventType}):`,
              msg,
            );
            send(eventType, msg);
          } catch (error) {
            console.error(
              "[bacbo-stream] Error parsing message:",
              error,
              rawMsg,
            );
          }
        });

        upstreamWs.on("error", (error: Error) => {
          console.error("[bacbo-stream] WebSocket error:", error);
          send("error", {
            message: "upstream ws error",
            details: error.message,
          });
        });

        upstreamWs.on("close", (code: number, reason: string) => {
          console.log("[bacbo-stream] WebSocket closed", { code, reason });
          send("disconnected", {
            message: "upstream ws disconnected",
            code,
            reason,
          });
          clearInterval(keepAlive);

          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch (error) {
              console.error(
                "[bacbo-stream] Error closing controller:",
                error,
              );
            }
          }
        });
      } catch (error) {
        console.error("[bacbo-stream] Fatal error:", error);
        send("error", {
          message: "failed to connect upstream ws",
          details: String(error),
        });
        clearInterval(keepAlive);

        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch (closeError) {
            console.error(
              "[bacbo-stream] Error closing on failure:",
              closeError,
            );
          }
        }
      }
    },

    cancel() {
      console.log("[bacbo-stream] Stream cancelled");
      closed = true;
      if (upstreamWs) {
        try {
          upstreamWs.close();
        } catch (error) {
          console.error("[bacbo-stream] Error closing WebSocket:", error);
        }
      }
    },
  });

  console.log("[bacbo-stream] Stream created, returning response");
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
