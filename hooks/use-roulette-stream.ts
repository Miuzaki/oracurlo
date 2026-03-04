import { useState, useEffect, useRef, useCallback } from "react";

export interface AviatorResult {
  id: number;
  multiplier: number;
  timestamp: string;
  destaque: boolean;
}

export interface AviatorStreamState {
  results: AviatorResult[];
  connected: boolean;
  error: string | null;
}

/**
 * Hook que conecta no SSE /api/roulette/stream
 * e mantém histórico de resultados (Aviator / Red Baron).
 */
export function useAviatorStream(channelId: string | null): AviatorStreamState {
  const [results, setResults] = useState<AviatorResult[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (!channelId) return;

    clearReconnectTimeout();

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setError(null);

    const es = new EventSource(
      `/api/roulette/stream?channel_id=${encodeURIComponent(channelId)}`,
    );
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
      setError(null);
    });

    es.addEventListener("history", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);

        if (Array.isArray(data.results)) {
          setResults((prev) => {
            /**
             * Dedupe por timestamp+multiplier, pois o id do backend
             * pode reiniciar em reconexões do upstream.
             */
            const map = new Map<string, AviatorResult>();

            for (const r of prev) {
              const key = `${r.timestamp}_${r.multiplier}`;
              map.set(key, r);
            }

            for (const r of data.results as AviatorResult[]) {
              const key = `${r.timestamp}_${r.multiplier}`;
              map.set(key, r);
            }

            // Ordena por timestamp desc (mais recente primeiro)
            const all = Array.from(map.values()).sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );

            return all.slice(0, 200);
          });
        }
      } catch {
        // ignore parse errors
      }
    });

    // Evento SSE custom "error" (enviado pelo backend)
    es.addEventListener("error", (event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data);
          setError(data.message || "Erro de conexao");
        } catch {
          setError("Erro de conexao");
        }
      }
      setConnected(false);
    });

    es.addEventListener("disconnected", () => {
      setConnected(false);

      clearReconnectTimeout();
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (esRef.current === es) {
          connect();
        }
      }, 3000);
    });

    // erro nativo da conexão EventSource
    es.onerror = () => {
      setConnected(false);
      es.close();

      clearReconnectTimeout();
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (esRef.current === es) {
          connect();
        }
      }, 5000);
    };
  }, [channelId]);

  useEffect(() => {
    // troca de canal => evita misturar histórico de jogos diferentes
    setResults([]);
    setConnected(false);
    setError(null);

    connect();

    return () => {
      clearReconnectTimeout();

      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect, channelId]);

  return { results, connected, error };
}
