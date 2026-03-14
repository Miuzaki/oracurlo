"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Player {
  id?: number | string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  externalId?: string;
  tenantId?: string;
  wallet?: {
    id?: number;
    balance?: number;
    credit?: number;
    available_value?: number;
    bonus?: number;
    currency?: string;
    withdraw_enabled?: number;
    rollover_is_active?: number;
    rollover_amount?: number;
    user_id?: number;
  };
  _cached?: {
    "get-credits"?: {
      credit?: number;
      bonus?: number;
    };
  };
  [key: string]: unknown;
}

// Session keys for sessionStorage
const SESSION_KEYS = {
  AUTH_TOKEN: "auth_token",
  PLAYER_DATA: "auth_player_data",
} as const;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEYS.AUTH_TOKEN);
}

function saveToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEYS.AUTH_TOKEN, token);
}

function clearSessionData() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEYS.AUTH_TOKEN);
  sessionStorage.removeItem(SESSION_KEYS.PLAYER_DATA);
}

function savePlayerData(player: Player) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEYS.PLAYER_DATA, JSON.stringify(player));
  } catch {
    // ignore
  }
}

function getStoredPlayerData(): Player | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.PLAYER_DATA);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Build auth headers for fetch calls to our Next.js API routes
function buildAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return {
    "Authorization": `Bearer ${token}`,
  };
}

interface AuthContextType {
  player: Player | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = getToken();
      if (!token) {
        setPlayer(null);
        return;
      }

      // Verify session by calling /api/auth/me with auth headers
      const res = await fetch("/api/auth/me", {
        headers: buildAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.player) {
          setPlayer(data.data.player);
          savePlayerData(data.data.player);
        } else {
          // Session invalid
          clearSessionData();
          setPlayer(null);
        }
      } else {
        // /me failed -- use stored player data as fallback if we still have tokens
        const storedPlayer = getStoredPlayerData();
        if (storedPlayer && token) {
          setPlayer(storedPlayer);
        } else {
          clearSessionData();
          setPlayer(null);
        }
      }
    } catch {
      const storedPlayer = getStoredPlayerData();
      const token = getToken();
      if (storedPlayer && token) {
        setPlayer(storedPlayer);
      } else {
        setPlayer(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        const { token, player: playerData } = data.data;

        if (token) {
          saveToken(token);
        }

        if (playerData) {
          setPlayer(playerData);
          savePlayerData(playerData);
        }

        // After saving, refresh balance in background
        setTimeout(async () => {
          try {
            const meRes = await fetch("/api/auth/me", {
              headers: buildAuthHeaders(),
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData.success && meData.data?.player) {
                setPlayer(meData.data.player);
                savePlayerData(meData.data.player);
              }
            }
          } catch {
            // ignore
          }
        }, 500);

        return { success: true, message: "Login realizado com sucesso!" };
      }

      return {
        success: false,
        message: data.message || "Erro ao realizar login",
      };
    } catch {
      return { success: false, message: "Erro de conexao com o servidor" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        headers: buildAuthHeaders(),
      });
    } finally {
      clearSessionData();
      setPlayer(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        player,
        isLoading,
        isAuthenticated: !!player,
        login,
        logout,
        checkSession,
        getAuthHeaders: buildAuthHeaders,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
