// Service références permanentes — couche d'abstraction vers l'API

import type { Reference, ApiResponse, CategorieReference } from "@/types";
import { apiClient } from "./api-client";

export interface ReferencesFilters {
  categorie?: CategorieReference;
  actif?: boolean;
}

export const ReferencesService = {
  /** Liste de toutes les références permanentes */
  lister(filtres?: ReferencesFilters): Promise<ApiResponse<Reference[]>> {
    return apiClient.get<ApiResponse<Reference[]>>("/references", {
      params: {
        categorie: filtres?.categorie,
        actif: filtres?.actif !== undefined ? String(filtres.actif) : undefined,
      },
    });
  },

  /** Création d'une nouvelle référence */
  creer(data: Partial<Reference>): Promise<ApiResponse<Reference>> {
    return apiClient.post<ApiResponse<Reference>>("/references", data);
  },

  /** Mise à jour d'une référence existante */
  modifier(id: string, data: Partial<Reference>): Promise<ApiResponse<Reference>> {
    return apiClient.put<ApiResponse<Reference>>(`/references/${id}`, data);
  },

  /** Suppression logique (désactivation) d'une référence */
  supprimer(id: string): Promise<ApiResponse<Reference>> {
    return apiClient.put<ApiResponse<Reference>>(`/references/${id}`, {
      actif: false,
    });
  },

  /** Export CSV */
  exporterCsv(categorie?: CategorieReference): Promise<Blob> {
    return apiClient.getBlob("/references/export/csv", {
      params: { categorie },
    });
  },
};
