"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Player {
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  mother_name?: string;
  username?: string;
  email?: string;
  email_verified_at?: string | null;
  token?: string;
  phone?: string;
  ddi?: string;
  gender?: number;
  birth_date?: string;
  is_active?: number;
  is_test?: number;
  cancelled_account?: number;
  created_at?: string;
  updated_at?: string;
  country?: string;
  currency?: string;
  language?: string;
  timezone?: string;
  city?: string;
  state?: string;
  address?: string;
  zipcode?: string;
  app_source?: string;
  affiliation_code?: string;
  ftd_value?: number;
  ftd_date?: string;
  previous_login?: string;
  last_login?: string;
  has_bank_account?: boolean;
  wallet?: {
    id?: number;
    balance?: number;
    credit?: number;
    available_value?: number;
    bonus?: number;
    withdraw_enabled?: number;
    rollover_is_active?: number;
    rollover_amount?: number;
    user_id?: number;
  };
  bonus_wallet?: {
    id?: number;
    credit?: number;
    credit_hold?: number;
  };
  document?: {
    id?: number;
    type?: string;
    number?: string;
    user_id?: number;
  };
  userInfo?: {
    status?: number;
    login_at?: string;
    login_city?: string;
    login_state?: string;
    login_ip?: string;
    login_device?: string;
    kyc_validated_at?: string;
    two_factor_enabled?: number;
    [key: string]: unknown;
  };
  user_info?: Record<string, unknown>;
  country_data?: {
    name?: string;
    code?: string;
    ddi?: string;
    currency?: string;
    alpha2?: string;
  };
  roles?: Array<{ id?: number; name?: string }>;
  _cached?: {
    "get-credits"?: {
      credit?: number;
      bonus?: number;
    };
    "get-first-deposit"?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

interface AuthContextType {
  player: Player | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[v0] AuthContext: verificando sessao...");
      const res = await fetch("/api/auth/me");
      console.log("[v0] AuthContext: /me status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("[v0] AuthContext: /me data:", JSON.stringify(data).substring(0, 300));
        if (data.success && data.data?.player) {
          setPlayer(data.data.player);
          console.log("[v0] AuthContext: player definido com sucesso");
        } else {
          setPlayer(null);
          console.log("[v0] AuthContext: sem player nos dados");
        }
      } else {
        setPlayer(null);
        console.log("[v0] AuthContext: /me retornou erro");
      }
    } catch (err) {
      console.log("[v0] AuthContext: erro ao verificar sessao:", err);
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log("[v0] AuthContext: iniciando login com email:", email);
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("[v0] AuthContext: login response status:", res.status);

      const data = await res.json();
      console.log("[v0] AuthContext: login response data:", JSON.stringify(data).substring(0, 500));

      if (data.success) {
        setPlayer(data.data.player);
        console.log("[v0] AuthContext: login OK, player definido");
        return { success: true, message: "Login realizado com sucesso!" };
      }

      return {
        success: false,
        message: data.message || "Erro ao realizar login",
      };
    } catch (err) {
      console.log("[v0] AuthContext: erro no login:", err);
      return { success: false, message: "Erro de conexao com o servidor" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log("[v0] AuthContext: fazendo logout");
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
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
