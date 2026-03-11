import { useState, useEffect, useRef, useCallback } from "react";

export type BacBoSide = "Azul" | "Vermelho" | "Empate";

export interface BacBoHistoryItem {
  winner: "Azul" | "Vermelho" | "Empate" | string;
  playerScore: number;
  bankerScore: number;
}

export interface BacBoStats {
  playerWins: number;
  bankerWins: number;
  ties: number;
}

export interface BacBoStreamState {
  history: BacBoHistoryItem[];
  stats: BacBoStats | null;
  connected: boolean;
  error: string | null;
}

type BacBoRoadPayload = {
  type?: string;
  id?: string;
  time?: number;
  args?: {
    stats?: BacBoStats;
    history?: BacBoHistoryItem[];
    restore?: boolean;
  };
};

type StreamEventEnvelope = {
  event?: "history" | "new";
  accountId?: string;
  gameSlug?: string;
  data?: unknown;
};

function isBacBoRoadPayload(data: unknown): data is BacBoRoadPayload {
  if (!data || typeof data !== "object") return false;
  const d = data as BacBoRoadPayload;
  return d.type === "bacbo.road" || !!d.args?.history;
}

export function useBacBoStream(
  accountId: string | null,
  gameSlug: string | null,
): BacBoStreamState {
  const [history, setHistory] = useState<BacBoHistoryItem[]>([]);
  const [stats, setStats] = useState<BacBoStats | null>(null);
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
    if (!accountId || !gameSlug) return;

    clearReconnectTimeout();

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setError(null);

    const qs = new URLSearchParams({
      account: accountId,
      game: gameSlug,
    });

    const es = new EventSource(`/api/bacbo/stream?${qs.toString()}`);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
      setError(null);
    });

    es.addEventListener("history", (event) => {
      try {
        const msg = JSON.parse(
          (event as MessageEvent).data,
        ) as StreamEventEnvelope;

        const data = msg?.data;
        if (!isBacBoRoadPayload(data)) return;

        const historyData = Array.isArray(data.args?.history)
          ? data.args!.history!
          : [];
        const statsData = data.args?.stats ?? null;

        setHistory(historyData.slice(0, 500).reverse());
        setStats(statsData);
      } catch {
        // ignore
      }
    });

    es.addEventListener("new", (event) => {
      try {
        const msg = JSON.parse(
          (event as MessageEvent).data,
        ) as StreamEventEnvelope;

        const data = msg?.data;
        if (!isBacBoRoadPayload(data)) return;

        const historyData = Array.isArray(data.args?.history)
          ? data.args!.history!
          : [];
        const statsData = data.args?.stats ?? null;

        setHistory(historyData.slice(0, 500).reverse());
        setStats(statsData);
      } catch {
        // ignore
      }
    });

    es.addEventListener("error", (event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data);
          setError(data.message || "Erro de conexao");
        } catch {
          setError("Erro de conexao");
        }
      } else {
        setError("Erro de conexao");
      }
      setConnected(false);
    });

    es.addEventListener("disconnected", () => {
      setConnected(false);

      clearReconnectTimeout();
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (esRef.current === es) connect();
      }, 3000);
    });

    es.onerror = () => {
      setConnected(false);
      es.close();

      clearReconnectTimeout();
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (esRef.current === es) connect();
      }, 5000);
    };
  }, [accountId, gameSlug]);

  useEffect(() => {
    setHistory([]);
    setStats(null);
    setConnected(false);
    setError(null);

    if (accountId && gameSlug) {
      connect();
    }

    return () => {
      clearReconnectTimeout();

      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect, accountId, gameSlug]);

  return {
    history,
    stats,
    connected,
    error,
  };
}
