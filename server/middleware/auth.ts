import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest, AuthenticatedUser } from "../types.js";
import type { Role } from "../../src/types/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-arretes-saas";

/**
 * Middleware d'authentification JWT.
 * Extrait le token Bearer, vérifie sa validité,
 * et attache l'utilisateur décodé à la requête.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      data: null,
      success: false,
      error: "Token d'authentification manquant",
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      data: null,
      success: false,
      error: "Token invalide ou expiré",
    });
  }
}

/**
 * Middleware de vérification de rôle.
 * Doit être utilisé après requireAuth.
 * Vérifie que l'utilisateur a au moins le rôle requis.
 *
 * Hiérarchie : admin > redacteur > lecteur
 */
export function requireRole(...roles: Role[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        data: null,
        success: false,
        error: "Utilisateur non authentifié",
      });
      return;
    }

    // L'admin a accès à tout
    if (req.user.role === "admin" || roles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      data: null,
      success: false,
      error: `Rôle insuffisant. Rôle(s) requis : ${roles.join(", ")}`,
    });
  };
}

/** Signe un JWT pour un utilisateur */
export function signToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}
