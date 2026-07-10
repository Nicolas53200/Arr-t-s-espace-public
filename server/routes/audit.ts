import { Router } from "express";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedRequest } from "../types.js";
import { requireAuth } from "../middleware/auth.js";

interface EntreeAudit {
  id: string;
  action: string;
  entite: string;
  entiteId: string;
  description: string;
  auteur: string;
  date: string;
  details?: Record<string, string>;
}

const router = Router();

// Journal en memoire
const journal: EntreeAudit[] = [
  {
    id: "audit-001",
    action: "creation",
    entite: "arrete",
    entiteId: "a1",
    description: "Creation de l'arrete AR-2026-0142-SPO",
    auteur: "M. Lefevre",
    date: "2026-06-18T09:15:00",
  },
  {
    id: "audit-002",
    action: "modification",
    entite: "arrete",
    entiteId: "a4",
    description: "Modification de l'arrete AR-2026-0099-STA",
    auteur: "Mme Bernard",
    date: "2026-05-12T14:22:00",
    details: { champ: "voies" },
  },
];

/**
 * GET /api/audit
 * Liste des entrees du journal avec filtres optionnels.
 * Query params : action, entite, from, to
 */
router.get("/", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, entite, from, to } = req.query as {
      action?: string;
      entite?: string;
      from?: string;
      to?: string;
    };

    let resultat = [...journal];

    if (action) {
      resultat = resultat.filter((e) => e.action === action);
    }

    if (entite) {
      resultat = resultat.filter((e) => e.entite === entite);
    }

    if (from) {
      resultat = resultat.filter((e) => e.date >= from);
    }

    if (to) {
      const finJournee = to + "T23:59:59";
      resultat = resultat.filter((e) => e.date <= finJournee);
    }

    resultat.sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      data: resultat,
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors de la liste du journal :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

/**
 * POST /api/audit
 * Enregistre une nouvelle entree dans le journal.
 */
router.post("/", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Partial<EntreeAudit>;

    if (!body.action || !body.entite || !body.description) {
      res.status(400).json({
        data: null,
        success: false,
        error: "Action, entite et description sont requis",
      });
      return;
    }

    const entree: EntreeAudit = {
      id: uuidv4(),
      action: body.action,
      entite: body.entite,
      entiteId: body.entiteId || "",
      description: body.description,
      auteur: req.user?.nom || "Inconnu",
      date: new Date().toISOString(),
      details: body.details,
    };

    journal.unshift(entree);

    res.status(201).json({
      data: entree,
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement audit :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

export default router;
