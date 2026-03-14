"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  identityType: "TENANT_ADMIN";
  roles?: {
    id: string;
    name: string;
    permissions?: string[];
  }[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

// Session keys for sessionStorage
const SESSION_KEYS = {
  ADMIN_TOKEN: "admin_auth_token",
  ADMIN_DATA: "admin_user_data",
  TENANT_DATA: "admin_tenant_data",
} as const;

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEYS.ADMIN_TOKEN);
}

function saveAdminToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEYS.ADMIN_TOKEN, token);
}

function clearAdminSessionData() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(SESSION_KEYS.ADMIN_DATA);
  sessionStorage.removeItem(SESSION_KEYS.TENANT_DATA);
}

function saveAdminData(admin: AdminUser) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEYS.ADMIN_DATA, JSON.stringify(admin));
  } catch {
    // ignore
  }
}

function getStoredAdminData(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.ADMIN_DATA);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveTenantData(tenant: Tenant) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEYS.TENANT_DATA, JSON.stringify(tenant));
  } catch {
    // ignore
  }
}

function getStoredTenantData(): Tenant | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.TENANT_DATA);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  getToken: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";
const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "oraculo-aviator";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = getAdminToken();
      if (!token) {
        setAdmin(null);
        setTenant(null);
        return;
      }

      // Verify session by calling /api/tenant/auth/me
      const res = await fetch(`${API_BASE_URL}/api/tenant/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const adminData: AdminUser = {
            id: data.data.id,
            email: data.data.email,
            name: data.data.name,
            identityType: "TENANT_ADMIN",
            roles: data.data.roles,
          };
          setAdmin(adminData);
          saveAdminData(adminData);
          
          // Restore tenant from storage
          const storedTenant = getStoredTenantData();
          if (storedTenant) {
            setTenant(storedTenant);
          }
        } else {
          clearAdminSessionData();
          setAdmin(null);
          setTenant(null);
        }
      } else {
        // Session invalid - use stored data as fallback
        const storedAdmin = getStoredAdminData();
        const storedTenant = getStoredTenantData();
        if (storedAdmin && token) {
          setAdmin(storedAdmin);
          setTenant(storedTenant);
        } else {
          clearAdminSessionData();
          setAdmin(null);
          setTenant(null);
        }
      }
    } catch {
      const storedAdmin = getStoredAdminData();
      const storedTenant = getStoredTenantData();
      const token = getAdminToken();
      if (storedAdmin && token) {
        setAdmin(storedAdmin);
        setTenant(storedTenant);
      } else {
        setAdmin(null);
        setTenant(null);
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
      const res = await fetch(`${API_BASE_URL}/api/tenant/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tenantSlug: TENANT_SLUG,
          email, 
          password 
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { token, admin: adminData, tenant: tenantData } = data.data;

        if (token) {
          saveAdminToken(token);
        }

        if (adminData) {
          const adminUser: AdminUser = {
            id: adminData.id,
            email: adminData.email,
            name: adminData.name,
            identityType: "TENANT_ADMIN",
          };
          setAdmin(adminUser);
          saveAdminData(adminUser);
        }

        if (tenantData) {
          setTenant(tenantData);
          saveTenantData(tenantData);
        }

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
      const token = getAdminToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/tenant/auth/logout`, { 
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } finally {
      clearAdminSessionData();
      setAdmin(null);
      setTenant(null);
    }
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        tenant,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
        checkSession,
        getToken: getAdminToken,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
