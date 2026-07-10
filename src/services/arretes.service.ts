// Service arrêtés — couche d'abstraction entre le frontend et l'API backend

import type {
  Arrete,
  ArreteFilters,
  ApiResponse,
  StatutArrete,
} from "@/types";
import { apiClient } from "./api-client";

export const ArretesService = {
  /** Liste des arrêtés avec filtres optionnels */
  lister(filtres?: ArreteFilters): Promise<ApiResponse<Arrete[]>> {
    return apiClient.get<ApiResponse<Arrete[]>>("/arretes", {
      params: {
        statut: filtres?.statut,
        type_code: filtres?.type_code,
        recherche: filtres?.recherche,
        date_debut: filtres?.date_debut,
        date_fin: filtres?.date_fin,
      },
    });
  },

  /** Détail d'un arrêté par son identifiant */
  parId(id: string): Promise<ApiResponse<Arrete>> {
    return apiClient.get<ApiResponse<Arrete>>(`/arretes/${id}`);
  },

  /** Création d'un nouvel arrêté */
  creer(data: Partial<Arrete>): Promise<ApiResponse<Arrete>> {
    return apiClient.post<ApiResponse<Arrete>>("/arretes", data);
  },

  /** Mise à jour d'un arrêté existant */
  modifier(id: string, data: Partial<Arrete>): Promise<ApiResponse<Arrete>> {
    return apiClient.put<ApiResponse<Arrete>>(`/arretes/${id}`, data);
  },

  /** Transition de statut dans le workflow de validation */
  transition(
    id: string,
    nouveauStatut: StatutArrete,
    auteur: string,
    commentaire?: string,
  ): Promise<ApiResponse<Arrete>> {
    return apiClient.patch<ApiResponse<Arrete>>(`/arretes/${id}/transition`, {
      nouveauStatut,
      auteur,
      commentaire,
    });
  },

  /** Abrogation d'un arrêté */
  abroger(id: string, motif: string): Promise<ApiResponse<Arrete>> {
    return apiClient.post<ApiResponse<Arrete>>(`/arretes/${id}/abroger`, {
      motif,
    });
  },

  /** Génération du PDF officiel (retourne un blob) */
  genererPdf(id: string): Promise<Blob> {
    return apiClient.getBlob(`/arretes/${id}/pdf`);
  },

  /** Export CSV avec filtres optionnels */
  exporterCsv(filtres?: Pick<ArreteFilters, "statut" | "type_code">): Promise<Blob> {
    return apiClient.getBlob("/arretes/export/csv", {
      params: {
        statut: filtres?.statut,
        type_code: filtres?.type_code,
      },
    });
  },
};
