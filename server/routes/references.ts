import { Router } from "express";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedRequest } from "../types.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { REFS_INITIALES } from "../../src/data/references.mock.js";
import type { Reference } from "../../src/types/domain.js";

const router = Router();

// Copie mutable des données mock (en mémoire)
const references: Reference[] = [...REFS_INITIALES];

/**
 * GET /api/references
 * Liste de toutes les références permanentes.
 */
router.get("/", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { categorie, actif } = req.query as {
      categorie?: string;
      actif?: string;
    };

    let resultat = [...references];

    if (categorie) {
      resultat = resultat.filter((r) => r.categorie === categorie);
    }

    if (actif !== undefined) {
      const isActif = actif === "true";
      resultat = resultat.filter((r) => r.actif === isActif);
    }

    res.json({
      data: resultat,
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors de la liste des références :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

/**
 * POST /api/references
 * Création d'une nouvelle référence permanente.
 * Requiert le rôle admin.
 */
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = req.body as Partial<Reference>;

      if (!body.code || !body.categorie || !body.label) {
        res.status(400).json({
          data: null,
          success: false,
          error: "Code, catégorie et label sont requis",
        });
        return;
      }

      const nouvelleRef: Reference = {
        id: uuidv4(),
        code: body.code,
        categorie: body.categorie,
        label: body.label,
        titulaire: body.titulaire || null,
        numero: body.numero || "",
        date: body.date || new Date().toISOString().slice(0, 10),
        actif: body.actif !== undefined ? body.actif : true,
        date_debut_validite:
          body.date_debut_validite || new Date().toISOString().slice(0, 10),
        date_fin_validite: body.date_fin_validite || "",
        historique: [],
      };

      references.push(nouvelleRef);

      res.status(201).json({
        data: nouvelleRef,
        success: true,
      });
    } catch (err) {
      console.error("Erreur lors de la création de la référence :", err);
      res.status(500).json({
        data: null,
        success: false,
        error: "Erreur interne du serveur",
      });
    }
  }
);

/**
 * PUT /api/references/:id
 * Mise à jour d'une référence permanente.
 * Requiert le rôle admin.
 */
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const index = references.findIndex((r) => r.id === req.params.id);

      if (index === -1) {
        res.status(404).json({
          data: null,
          success: false,
          error: "Référence non trouvée",
        });
        return;
      }

      const existing = references[index]!;
      const body = req.body as Partial<Reference>;

      // Archiver l'état précédent dans l'historique si le titulaire change
      const historiqueMaj =
        body.titulaire && body.titulaire !== existing.titulaire
          ? [
              ...existing.historique,
              {
                numero: existing.numero,
                date: existing.date,
                titulaire: existing.titulaire,
                date_fin: new Date().toISOString().slice(0, 10),
              },
            ]
          : existing.historique;

      const refMiseAJour: Reference = {
        ...existing,
        ...body,
        id: existing.id,
        historique: historiqueMaj,
      };

      references[index] = refMiseAJour;

      res.json({
        data: refMiseAJour,
        success: true,
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la référence :", err);
      res.status(500).json({
        data: null,
        success: false,
        error: "Erreur interne du serveur",
      });
    }
  }
);

export default router;
