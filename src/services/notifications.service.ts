// Service notifications — couche d'abstraction vers l'API

import type { Notification, ApiResponse } from "@/types";
import { apiClient } from "./api-client";

export const NotificationsService = {
  /** Liste des notifications de l'utilisateur connecté */
  lister(): Promise<ApiResponse<Notification[]>> {
    return apiClient.get<ApiResponse<Notification[]>>("/notifications");
  },

  /** Marquer une notification comme lue */
  marquerLue(id: string): Promise<ApiResponse<Notification>> {
    return apiClient.patch<ApiResponse<Notification>>(
      `/notifications/${id}/read`,
    );
  },

  /** Marquer toutes les notifications comme lues */
  marquerToutesLues(): Promise<ApiResponse<{ marquees: number }>> {
    return apiClient.post<ApiResponse<{ marquees: number }>>(
      "/notifications/mark-all-read",
    );
  },
};
