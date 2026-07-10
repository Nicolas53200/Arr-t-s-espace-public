import { Router } from "express";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedRequest } from "../types.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "redacteur" | "lecteur";
  actif: boolean;
  derniere_connexion?: string;
  date_creation: string;
}

interface ConfigTenant {
  id: string;
  nom: string;
  siren: string;
  adresse: string;
  logo?: string;
  couleur_primaire: string;
  modules_actifs: string[];
  limites: {
    max_utilisateurs: number;
    max_arretes: number;
    stockage_mo: number;
  };
}

const router = Router();

// Donnees en memoire
const utilisateurs: Utilisateur[] = [
  { id: "u1", nom: "M. Lefevre", email: "lefevre@saint-avoye.fr", role: "redacteur", actif: true, derniere_connexion: "2026-07-10T08:00:00", date_creation: "2025-03-15" },
  { id: "u2", nom: "Mme Bernard", email: "bernard@saint-avoye.fr", role: "redacteur", actif: true, derniere_connexion: "2026-07-09T14:30:00", date_creation: "2025-03-15" },
  { id: "u3", nom: "Admin SaaS", email: "admin@arretes-saas.fr", role: "admin", actif: true, derniere_connexion: "2026-07-10T07:45:00", date_creation: "2025-01-01" },
  { id: "u4", nom: "M. Dupont", email: "dupont@saint-avoye.fr", role: "lecteur", actif: true, derniere_connexion: "2026-07-08T09:00:00", date_creation: "2025-06-01" },
  { id: "u5", nom: "Mme Moreau", email: "moreau@saint-avoye.fr", role: "lecteur", actif: false, derniere_connexion: "2026-04-15T16:00:00", date_creation: "2025-09-10" },
];

const configTenant: ConfigTenant = {
  id: "tenant_saint_avoye",
  nom: "Ville de Saint-Avoye",
  siren: "215600001",
  adresse: "1 Place de la Mairie, 56000 Saint-Avoye",
  couleur_primaire: "#1E3A5F",
  modules_actifs: ["cartographie", "pdf", "export"],
  limites: { max_utilisateurs: 20, max_arretes: 500, stockage_mo: 2048 },
};

/**
 * GET /api/admin/users
 * Liste des utilisateurs. Requiert le role admin.
 */
router.get("/users", requireAuth, requireRole("admin"), (_req: AuthenticatedRequest, res: Response) => {
  res.json({ data: utilisateurs, success: true });
});

/**
 * POST /api/admin/users
 * Creation d'un utilisateur. Requiert le role admin.
 */
router.post("/users", requireAuth, requireRole("admin"), (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Partial<Utilisateur>;

    if (!body.nom || !body.email || !body.role) {
      res.status(400).json({ data: null, success: false, error: "Nom, email et role sont requis" });
      return;
    }

    const nouvelUtilisateur: Utilisateur = {
      id: uuidv4(),
      nom: body.nom,
      email: body.email,
      role: body.role,
      actif: true,
      date_creation: new Date().toISOString().slice(0, 10),
    };

    utilisateurs.push(nouvelUtilisateur);

    res.status(201).json({ data: nouvelUtilisateur, success: true });
  } catch (err) {
    console.error("Erreur creation utilisateur :", err);
    res.status(500).json({ data: null, success: false, error: "Erreur interne du serveur" });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Mise a jour d'un utilisateur. Requiert le role admin.
 */
router.patch("/users/:id", requireAuth, requireRole("admin"), (req: AuthenticatedRequest, res: Response) => {
  try {
    const index = utilisateurs.findIndex((u) => u.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ data: null, success: false, error: "Utilisateur non trouve" });
      return;
    }

    const body = req.body as Partial<Utilisateur>;
    const existing = utilisateurs[index]!;

    utilisateurs[index] = {
      ...existing,
      ...body,
      id: existing.id,
      date_creation: existing.date_creation,
    };

    res.json({ data: utilisateurs[index], success: true });
  } catch (err) {
    console.error("Erreur mise a jour utilisateur :", err);
    res.status(500).json({ data: null, success: false, error: "Erreur interne du serveur" });
  }
});

/**
 * GET /api/admin/config
 * Configuration du tenant. Requiert le role admin.
 */
router.get("/config", requireAuth, requireRole("admin"), (_req: AuthenticatedRequest, res: Response) => {
  res.json({ data: configTenant, success: true });
});

/**
 * PUT /api/admin/config
 * Mise a jour de la configuration. Requiert le role admin.
 */
router.put("/config", requireAuth, requireRole("admin"), (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Partial<ConfigTenant>;

    if (body.nom !== undefined) configTenant.nom = body.nom;
    if (body.siren !== undefined) configTenant.siren = body.siren;
    if (body.adresse !== undefined) configTenant.adresse = body.adresse;
    if (body.couleur_primaire !== undefined) configTenant.couleur_primaire = body.couleur_primaire;
    if (body.modules_actifs !== undefined) configTenant.modules_actifs = body.modules_actifs;

    res.json({ data: configTenant, success: true });
  } catch (err) {
    console.error("Erreur mise a jour config :", err);
    res.status(500).json({ data: null, success: false, error: "Erreur interne du serveur" });
  }
});

export default router;
