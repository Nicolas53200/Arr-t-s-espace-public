// Client HTTP générique pour l'API backend
// Gère l'authentification, le tenant, et les erreurs HTTP standardisées.

import { ENV } from "@/config/env";

// ---------------------------------------------------------------------------
// Erreurs personnalisées
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Accès interdit") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Ressource non trouvée") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ServerError extends ApiError {
  constructor(message = "Erreur interne du serveur") {
    super(message, 500);
    this.name = "ServerError";
  }
}

// ---------------------------------------------------------------------------
// Stockage local du token et du tenantId
// ---------------------------------------------------------------------------

const STORAGE_TOKEN_KEY = "auth_token";
const STORAGE_TENANT_KEY = "tenant_id";

function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function getStoredTenantId(): string | null {
  return localStorage.getItem(STORAGE_TENANT_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
}

export function setTenantId(id: string): void {
  localStorage.setItem(STORAGE_TENANT_KEY, id);
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_TENANT_KEY);
}

// ---------------------------------------------------------------------------
// Client API
// ---------------------------------------------------------------------------

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  params?: Record<string, string | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(`${ENV.API_URL}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const tenantId = getStoredTenantId();
  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new ApiError("Non authentifié", 401);
  }

  if (response.status === 403) {
    throw new ForbiddenError();
  }

  if (response.status === 404) {
    throw new NotFoundError();
  }

  if (response.status >= 500) {
    throw new ServerError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      body,
    );
  }

  return response.json() as Promise<T>;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = buildUrl(path, options?.params);
  const init: RequestInit = {
    method,
    headers: buildHeaders(),
    signal: options?.signal,
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const response = await fetch(url, init);
  return handleResponse<T>(response);
}

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  },

  /** Téléchargement binaire (PDF, CSV, etc.) */
  async getBlob(path: string, options?: RequestOptions): Promise<Blob> {
    const url = buildUrl(path, options?.params);
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
      signal: options?.signal,
    });

    if (!response.ok) {
      await handleResponse<never>(response);
    }

    return response.blob();
  },
};

// ---------------------------------------------------------------------------
// Utilitaire mock (conservé pour compatibilité)
// ---------------------------------------------------------------------------

export async function mockDelay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
