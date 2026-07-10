// Service journal d'audit — couche d'abstraction vers l'API

import type { EntreeAudit, ActionAudit, ApiResponse } from "@/types";
import { apiClient } from "./api-client";

export interface AuditFilters {
  action?: ActionAudit;
  entite?: "arrete" | "reference" | "utilisateur";
  from?: string;
  to?: string;
}

export type AuditExportFormat = "csv" | "json";

export const AuditService = {
  /** Liste des entrées du journal d'audit */
  lister(filtres?: AuditFilters): Promise<ApiResponse<EntreeAudit[]>> {
    return apiClient.get<ApiResponse<EntreeAudit[]>>("/audit", {
      params: {
        action: filtres?.action,
        entite: filtres?.entite,
        from: filtres?.from,
        to: filtres?.to,
      },
    });
  },

  /** Export du journal dans le format demandé */
  exporter(format: AuditExportFormat): Promise<Blob> {
    return apiClient.getBlob(`/audit/export/${format}`);
  },
};
