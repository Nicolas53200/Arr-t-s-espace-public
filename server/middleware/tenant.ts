import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types.js";
import { TENANTS_MOCK } from "../../src/data/tenants.mock.js";

/**
 * Middleware d'extraction du tenant.
 * Extrait le header X-Tenant-ID, vérifie son existence
 * dans la base de tenants, et l'attache à la requête.
 */
export function extractTenant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const tenantId = req.headers["x-tenant-id"] as string | undefined;

  if (!tenantId) {
    res.status(400).json({
      data: null,
      success: false,
      error: "Header X-Tenant-ID manquant",
    });
    return;
  }

  const tenant = TENANTS_MOCK.find((t) => t.id === tenantId);
  if (!tenant) {
    res.status(404).json({
      data: null,
      success: false,
      error: `Tenant inconnu : ${tenantId}`,
    });
    return;
  }

  req.tenantId = tenantId;
  next();
}
