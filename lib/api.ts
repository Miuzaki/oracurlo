/**
 * API Client Library for HistoryLab Backend
 * Supports both Operational (player) and Tenant (admin) APIs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";
const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "oraculo-aviator";

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    tenantId?: string;
    identityType: "EXTERNAL_USER" | "TENANT_ADMIN";
  };
}

export interface TenantLoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
    identityType: "TENANT_ADMIN";
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface BalanceResponse {
  balance: number;
  currency: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  externalId?: string;
  tenantId?: string;
  createdAt?: string;
}

// Game Types
export interface Game {
  id: string;
  name: string;
  slug: string;
  playId?: string;
  description?: string;
  isActive?: boolean;
  provider?: string;
  visibility?: "VISIBLE" | "HIDDEN" | "DISABLED";
  isFeatured?: boolean;
  customName?: string | null;
  customThumbnail?: string | null;
  tenantConfig?: {
    enabled: boolean;
    visibility: "VISIBLE" | "HIDDEN" | "DISABLED";
    sortOrder: number;
    isFeatured: boolean;
    customName: string | null;
    customThumbnail: string | null;
  };
}

export interface GameStartResponse {
  launchUrl: string;
  gameSlug: string;
  platform: string;
  isDemo: boolean;
}

// Deposit Types
export interface DepositRequest {
  amountCents: number;
}

export interface DepositResponse {
  id: string;
  amountCents: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  pixQrCode: string;
  pixBrCode: string;
  expiresAt: string;
  createdAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalGames: number;
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  depositVolume: number;
  withdrawalVolume: number;
}

// Transaction Types
export interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amountCents: number;
  status: string;
  externalUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

// Mission Types
export interface Mission {
  id: string;
  name: string;
  code?: string;
  description?: string;
  trigger: "DEPOSIT_COMPLETED" | "WITHDRAWAL_COMPLETED" | "CUSTOM";
  type: "AUTOMATIC" | "MANUAL_REVIEW";
  points: number;
  recurrence: "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY";
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";
  minAmountCents?: number;
  maxParticipations?: number;
  isVisible: boolean;
  successMessage?: string;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  updatedAt?: string;
  userParticipation?: {
    id: string;
    status: string;
    completedAt?: string;
  } | null;
}

export interface MissionParticipant {
  id: string;
  externalUserId: string;
  status: string;
  evidence?: unknown[];
  submittedAt?: string;
  reviewedAt?: string;
  completedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface MissionStats {
  total: number;
  accepted: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
  rejected: number;
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private tenantSlug: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.tenantSlug = TENANT_SLUG;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error("[v0] API request failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro de conexão",
      };
    }
  }

  // ==========================================================================
  // Operational API (Player)
  // ==========================================================================

  operational = {
    auth: {
      login: async (
        email: string,
        password: string
      ): Promise<ApiResponse<LoginResponse>> => {
        return this.request<LoginResponse>("/api/operational/auth/login", {
          method: "POST",
          body: JSON.stringify({
            tenantSlug: this.tenantSlug,
            email,
            password,
          }),
        });
      },

      logout: async (token: string): Promise<ApiResponse<{ message: string }>> => {
        return this.request<{ message: string }>(
          "/api/operational/auth/logout",
          { method: "POST" },
          token
        );
      },

      me: async (token: string): Promise<ApiResponse<UserProfile>> => {
        return this.request<UserProfile>(
          "/api/operational/auth/me",
          { method: "GET" },
          token
        );
      },

      balance: async (token: string): Promise<ApiResponse<BalanceResponse>> => {
        return this.request<BalanceResponse>(
          "/api/operational/auth/balance",
          { method: "GET" },
          token
        );
      },
    },

    games: {
      listPublic: async (): Promise<ApiResponse<Game[]>> => {
        return this.request<Game[]>(
          `/api/operational/games/${this.tenantSlug}/list`,
          { method: "GET" }
        );
      },

      list: async (token: string): Promise<ApiResponse<Game[]>> => {
        return this.request<Game[]>(
          "/api/operational/games",
          { method: "GET" },
          token
        );
      },

      get: async (token: string, slug: string): Promise<ApiResponse<Game>> => {
        return this.request<Game>(
          `/api/operational/games/${slug}`,
          { method: "GET" },
          token
        );
      },

      start: async (
        token: string,
        slug: string,
        options?: { platform?: string; demo?: boolean }
      ): Promise<ApiResponse<GameStartResponse>> => {
        const params = new URLSearchParams();
        if (options?.platform) params.set("platform", options.platform);
        if (options?.demo) params.set("demo", "1");
        const query = params.toString() ? `?${params.toString()}` : "";
        return this.request<GameStartResponse>(
          `/api/operational/games/${slug}/start${query}`,
          { method: "GET" },
          token
        );
      },
    },

    deposits: {
      create: async (
        token: string,
        amountCents: number
      ): Promise<ApiResponse<DepositResponse>> => {
        return this.request<DepositResponse>(
          "/api/operational/deposits",
          {
            method: "POST",
            body: JSON.stringify({ amountCents }),
          },
          token
        );
      },

      list: async (
        token: string,
        limit?: number
      ): Promise<ApiResponse<DepositResponse[]>> => {
        const query = limit ? `?limit=${limit}` : "";
        return this.request<DepositResponse[]>(
          `/api/operational/deposits${query}`,
          { method: "GET" },
          token
        );
      },

      checkPending: async (
        token: string
      ): Promise<ApiResponse<DepositResponse[]>> => {
        return this.request<DepositResponse[]>(
          "/api/operational/deposits/pending",
          { method: "GET" },
          token
        );
      },

      getStatus: async (
        token: string,
        id: string
      ): Promise<ApiResponse<DepositResponse>> => {
        return this.request<DepositResponse>(
          `/api/operational/deposits/${id}/status`,
          { method: "GET" },
          token
        );
      },
    },

    missions: {
      list: async (token: string): Promise<ApiResponse<Mission[]>> => {
        return this.request<Mission[]>(
          "/api/operational/missions",
          { method: "GET" },
          token
        );
      },

      my: async (
        token: string,
        params?: { status?: string; limit?: number; offset?: number }
      ): Promise<ApiResponse<MissionParticipant[]>> => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set("status", params.status);
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
        return this.request<MissionParticipant[]>(
          `/api/operational/missions/my${query}`,
          { method: "GET" },
          token
        );
      },

      accept: async (
        token: string,
        missionId: string
      ): Promise<ApiResponse<MissionParticipant>> => {
        return this.request<MissionParticipant>(
          `/api/operational/missions/${missionId}/accept`,
          { method: "POST" },
          token
        );
      },

      submit: async (
        token: string,
        missionId: string,
        evidence?: { type: string; url?: string; content?: string }[]
      ): Promise<ApiResponse<MissionParticipant>> => {
        return this.request<MissionParticipant>(
          `/api/operational/missions/${missionId}/submit`,
          {
            method: "POST",
            body: JSON.stringify({ evidence }),
          },
          token
        );
      },
    },
  };

  // ==========================================================================
  // Tenant API (Admin)
  // ==========================================================================

  tenant = {
    auth: {
      login: async (
        email: string,
        password: string,
        tenantSlug?: string
      ): Promise<ApiResponse<TenantLoginResponse>> => {
        return this.request<TenantLoginResponse>("/api/tenant/auth/login", {
          method: "POST",
          body: JSON.stringify({
            tenantSlug: tenantSlug || this.tenantSlug,
            email,
            password,
          }),
        });
      },

      logout: async (token: string): Promise<ApiResponse<{ message: string }>> => {
        return this.request<{ message: string }>(
          "/api/tenant/auth/logout",
          { method: "POST" },
          token
        );
      },

      me: async (token: string): Promise<ApiResponse<unknown>> => {
        return this.request<unknown>(
          "/api/tenant/auth/me",
          { method: "GET" },
          token
        );
      },

      admins: async (token: string): Promise<ApiResponse<unknown[]>> => {
        return this.request<unknown[]>(
          "/api/tenant/auth/admins",
          { method: "GET" },
          token
        );
      },
    },

    dashboard: {
      stats: async (token: string): Promise<ApiResponse<DashboardStats>> => {
        return this.request<DashboardStats>(
          "/api/tenant/dashboard",
          { method: "GET" },
          token
        );
      },

      modules: async (token: string): Promise<ApiResponse<{ key: string; enabled: boolean }[]>> => {
        return this.request<{ key: string; enabled: boolean }[]>(
          "/api/tenant/dashboard/modules",
          { method: "GET" },
          token
        );
      },

      users: async (
        token: string,
        params?: { page?: number; limit?: number; search?: string }
      ): Promise<ApiResponse<PaginatedResponse<UserProfile>>> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
        return this.request<PaginatedResponse<UserProfile>>(
          `/api/tenant/dashboard/users${query}`,
          { method: "GET" },
          token
        );
      },
    },

    games: {
      list: async (
        token: string,
        search?: string
      ): Promise<ApiResponse<Game[]>> => {
        const query = search ? `?search=${encodeURIComponent(search)}` : "";
        return this.request<Game[]>(
          `/api/tenant/games${query}`,
          { method: "GET" },
          token
        );
      },

      get: async (token: string, id: string): Promise<ApiResponse<Game>> => {
        return this.request<Game>(
          `/api/tenant/games/${id}`,
          { method: "GET" },
          token
        );
      },

      updateConfig: async (
        token: string,
        id: string,
        config: {
          enabled?: boolean;
          visibility?: "VISIBLE" | "HIDDEN" | "DISABLED";
          sortOrder?: number;
          isFeatured?: boolean;
          customName?: string | null;
          customThumbnail?: string | null;
        }
      ): Promise<ApiResponse<Game>> => {
        return this.request<Game>(
          `/api/tenant/games/${id}/config`,
          {
            method: "PATCH",
            body: JSON.stringify(config),
          },
          token
        );
      },

      bulk: async (
        token: string,
        items: { gameId: string; enabled: boolean }[]
      ): Promise<ApiResponse<unknown>> => {
        return this.request<unknown>(
          "/api/tenant/games/bulk",
          {
            method: "POST",
            body: JSON.stringify({ items }),
          },
          token
        );
      },
    },

    missions: {
      list: async (
        token: string,
        params?: {
          status?: string;
          type?: string;
          trigger?: string;
          limit?: number;
          offset?: number;
        }
      ): Promise<ApiResponse<Mission[]>> => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set("status", params.status);
        if (params?.type) searchParams.set("type", params.type);
        if (params?.trigger) searchParams.set("trigger", params.trigger);
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
        return this.request<Mission[]>(
          `/api/tenant/missions${query}`,
          { method: "GET" },
          token
        );
      },

      get: async (token: string, missionId: string): Promise<ApiResponse<Mission>> => {
        return this.request<Mission>(
          `/api/tenant/missions/${missionId}`,
          { method: "GET" },
          token
        );
      },

      create: async (
        token: string,
        mission: Partial<Mission>
      ): Promise<ApiResponse<Mission>> => {
        return this.request<Mission>(
          "/api/tenant/missions",
          {
            method: "POST",
            body: JSON.stringify(mission),
          },
          token
        );
      },

      update: async (
        token: string,
        missionId: string,
        mission: Partial<Mission>
      ): Promise<ApiResponse<Mission>> => {
        return this.request<Mission>(
          `/api/tenant/missions/${missionId}`,
          {
            method: "PATCH",
            body: JSON.stringify(mission),
          },
          token
        );
      },

      stats: async (
        token: string,
        missionId: string
      ): Promise<ApiResponse<MissionStats>> => {
        return this.request<MissionStats>(
          `/api/tenant/missions/${missionId}/stats`,
          { method: "GET" },
          token
        );
      },

      participants: async (
        token: string,
        missionId: string,
        params?: { status?: string; limit?: number; offset?: number }
      ): Promise<ApiResponse<MissionParticipant[]>> => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set("status", params.status);
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
        return this.request<MissionParticipant[]>(
          `/api/tenant/missions/${missionId}/participants${query}`,
          { method: "GET" },
          token
        );
      },

      reviewQueue: async (token: string): Promise<ApiResponse<MissionParticipant[]>> => {
        return this.request<MissionParticipant[]>(
          "/api/tenant/missions/review-queue",
          { method: "GET" },
          token
        );
      },

      review: async (
        token: string,
        userMissionId: string,
        approved: boolean,
        reviewNotes?: string
      ): Promise<ApiResponse<MissionParticipant>> => {
        return this.request<MissionParticipant>(
          `/api/tenant/missions/review/${userMissionId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ approved, reviewNotes }),
          },
          token
        );
      },
    },

    transactions: {
      list: async (
        token: string,
        params?: {
          type?: "DEPOSIT" | "WITHDRAWAL";
          status?: string;
          externalUserId?: string;
          startDate?: string;
          endDate?: string;
          limit?: number;
          offset?: number;
        }
      ): Promise<ApiResponse<Transaction[]>> => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.set("type", params.type);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.externalUserId) searchParams.set("externalUserId", params.externalUserId);
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
        return this.request<Transaction[]>(
          `/api/tenant/transactions${query}`,
          { method: "GET" },
          token
        );
      },

      get: async (
        token: string,
        transactionId: string
      ): Promise<ApiResponse<Transaction>> => {
        return this.request<Transaction>(
          `/api/tenant/transactions/${transactionId}`,
          { method: "GET" },
          token
        );
      },
    },

    audit: async (
      token: string,
      params?: {
        page?: number;
        limit?: number;
        action?: string;
        resource?: string;
      }
    ): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.action) searchParams.set("action", params.action);
      if (params?.resource) searchParams.set("resource", params.resource);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return this.request<PaginatedResponse<unknown>>(
        `/api/tenant/audit${query}`,
        { method: "GET" },
        token
      );
    },

    maintenance: {
      status: async (token: string): Promise<ApiResponse<{
        isEnabled: boolean;
        message: string | null;
        forcedByCentral: boolean;
        canSelfMaintenance: boolean;
      }>> => {
        return this.request<{
          isEnabled: boolean;
          message: string | null;
          forcedByCentral: boolean;
          canSelfMaintenance: boolean;
        }>(
          "/api/tenant/maintenance",
          { method: "GET" },
          token
        );
      },

      toggle: async (
        token: string,
        enabled: boolean,
        message?: string
      ): Promise<ApiResponse<unknown>> => {
        return this.request<unknown>(
          "/api/tenant/maintenance",
          {
            method: "PATCH",
            body: JSON.stringify({ enabled, message }),
          },
          token
        );
      },
    },
  };
}

// Singleton instance
export const api = new ApiClient();
