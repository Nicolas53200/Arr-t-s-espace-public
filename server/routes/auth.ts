import { Router } from "express";
import type { Response } from "express";
import bcrypt from "bcryptjs";
import type { AuthenticatedRequest } from "../types.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { USERS_MOCK } from "../../src/data/tenants.mock.js";

const router = Router();

/**
 * Mots de passe mock hashés en mémoire.
 * En production, les hash seront stockés en base.
 */
const PASSWORD_MOCK = "password123";
let hashedPassword: string | null = null;

async function getHashedPassword(): Promise<string> {
  if (!hashedPassword) {
    hashedPassword = await bcrypt.hash(PASSWORD_MOCK, 10);
  }
  return hashedPassword;
}

/**
 * POST /api/auth/login
 * Authentification par email + mot de passe (mock).
 * Retourne un JWT et les informations utilisateur.
 */
router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({
        data: null,
        success: false,
        error: "Email et mot de passe requis",
      });
      return;
    }

    // Recherche de l'utilisateur par email
    const user = USERS_MOCK.find((u) => u.email === email);
    if (!user) {
      res.status(401).json({
        data: null,
        success: false,
        error: "Identifiants incorrects",
      });
      return;
    }

    // Vérification du mot de passe (mock : tous les utilisateurs ont le même)
    const hash = await getHashedPassword();
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      res.status(401).json({
        data: null,
        success: false,
        error: "Identifiants incorrects",
      });
      return;
    }

    const token = signToken(user);

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          nom: user.nom,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
        },
      },
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors du login :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

/**
 * GET /api/auth/me
 * Retourne les informations de l'utilisateur connecté.
 */
router.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      data: req.user,
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors de /me :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion (mock : retourne simplement un succès).
 * En production, invalider le token côté serveur (blacklist ou Redis).
 */
router.post(
  "/logout",
  requireAuth,
  (_req: AuthenticatedRequest, res: Response) => {
    res.json({
      data: null,
      success: true,
    });
  }
);

export default router;
