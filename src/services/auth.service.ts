// Service d'authentification — login, logout, profil

import type { User, ApiResponse } from "@/types";
import { apiClient, setToken, setTenantId, clearAuth } from "./api-client";

interface LoginResponse {
  token: string;
  user: User;
}

export const AuthService = {
  /** Connexion par email et mot de passe */
  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      { email, password },
    );
    if (response.success && response.data) {
      setToken(response.data.token);
      setTenantId(response.data.user.tenant_id);
    }
    return response;
  },

  /** Déconnexion — supprime le token local */
  async logout(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<null>>("/auth/logout");
    } finally {
      clearAuth();
    }
  },

  /** Profil de l'utilisateur connecté */
  profil(): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>("/auth/me");
  },
};
