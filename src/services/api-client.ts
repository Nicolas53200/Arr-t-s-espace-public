import type { ApiResponse } from "@/types";

interface ApiClientConfig {
  baseUrl: string;
  tenantId: string;
  token?: string;
}

let config: ApiClientConfig = {
  baseUrl: "/api",
  tenantId: "",
};

export function configureApiClient(cfg: Partial<ApiClientConfig>) {
  config = { ...config, ...cfg };
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": config.tenantId,
  };
  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    return {
      data: null as unknown as T,
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  }

  const data = (await response.json()) as T;
  return { data, success: true };
}

export async function mockDelay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
