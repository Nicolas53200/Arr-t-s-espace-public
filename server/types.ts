import type { Request } from "express";
import type { Role } from "../src/types/auth.js";

/**
 * Extension du type Request Express pour inclure
 * l'utilisateur authentifié et le tenant courant.
 */
export interface AuthenticatedUser {
  id: string;
  nom: string;
  email: string;
  role: Role;
  tenant_id: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}

/** Format standard de réponse API */
export interface ApiResponseBody<T = unknown> {
  data: T;
  success: boolean;
  error?: string;
}
