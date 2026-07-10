import { Router } from "express";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedRequest } from "../types.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ARRETES_INITIAUX } from "../../src/data/arretes.mock.js";
import type { Arrete } from "../../src/types/domain.js";

const router = Router();

// Copie mutable des données mock (en mémoire)
const arretes: Arrete[] = [...ARRETES_INITIAUX];

/**
 * GET /api/arretes
 * Liste des arrêtés avec filtres optionnels.
 * Query params : statut, type_code, recherche
 */
router.get("/", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { statut, type_code, recherche } = req.query as {
      statut?: string;
      type_code?: string;
      recherche?: string;
    };

    let resultat = [...arretes];

    if (statut) {
      resultat = resultat.filter((a) => a.statut === statut);
    }

    if (type_code) {
      resultat = resultat.filter((a) => a.type_code === type_code);
    }

    if (recherche) {
      const terme = recherche.toLowerCase();
      resultat = resultat.filter(
        (a) =>
          a.titre.toLowerCase().includes(terme) ||
          a.numero.toLowerCase().includes(terme) ||
          a.cree_par.toLowerCase().includes(terme)
      );
    }

    res.json({
      data: resultat,
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors de la liste des arrêtés :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

/**
 * GET /api/arretes/:id
 * Détail d'un arrêté par son identifiant.
 */
router.get("/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const arrete = arretes.find((a) => a.id === req.params.id);

    if (!arrete) {
      res.status(404).json({
        data: null,
        success: false,
        error: "Arrêté non trouvé",
      });
      return;
    }

    res.json({
      data: arrete,
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors de la récupération de l'arrêté :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

/**
 * POST /api/arretes
 * Création d'un nouvel arrêté.
 * Requiert le rôle rédacteur ou admin.
 */
router.post(
  "/",
  requireAuth,
  requireRole("redacteur"),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = req.body as Partial<Arrete>;

      if (!body.titre || !body.type_code) {
        res.status(400).json({
          data: null,
          success: false,
          error: "Titre et type_code sont requis",
        });
        return;
      }

      const nouvelArrete: Arrete = {
        id: uuidv4(),
        numero: body.numero || `AR-${new Date().getFullYear()}-${String(arretes.length + 1).padStart(4, "0")}`,
        type_code: body.type_code,
        type_label: body.type_label || body.type_code,
        titre: body.titre,
        statut: "brouillon",
        cree_par: req.user?.nom || "Inconnu",
        date_creation: new Date().toISOString().slice(0, 10),
        date_debut: body.date_debut || "",
        date_fin: body.date_fin || "",
        voies: body.voies || [],
        troncons: body.troncons || [],
        versions: [],
        arrete_abrogation: null,
      };

      arretes.push(nouvelArrete);

      res.status(201).json({
        data: nouvelArrete,
        success: true,
      });
    } catch (err) {
      console.error("Erreur lors de la création de l'arrêté :", err);
      res.status(500).json({
        data: null,
        success: false,
        error: "Erreur interne du serveur",
      });
    }
  }
);

/**
 * PUT /api/arretes/:id
 * Mise à jour d'un arrêté existant.
 * Requiert le rôle rédacteur ou admin.
 */
router.put(
  "/:id",
  requireAuth,
  requireRole("redacteur"),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const index = arretes.findIndex((a) => a.id === req.params.id);

      if (index === -1) {
        res.status(404).json({
          data: null,
          success: false,
          error: "Arrêté non trouvé",
        });
        return;
      }

      const existing = arretes[index]!;
      const body = req.body as Partial<Arrete>;

      // Sauvegarde de la version précédente
      const versionPrecedente = {
        version: existing.versions.length + 1,
        date: new Date().toISOString().slice(0, 10),
        auteur: req.user?.nom || "Inconnu",
        motif: body.titre !== existing.titre ? "Modification du titre" : "Mise à jour",
        titre: existing.titre,
      };

      const arreteMisAJour: Arrete = {
        ...existing,
        ...body,
        id: existing.id, // On ne peut pas changer l'id
        statut: existing.statut === "brouillon" ? "brouillon" : "modifie",
        versions: [...existing.versions, versionPrecedente],
      };

      arretes[index] = arreteMisAJour;

      res.json({
        data: arreteMisAJour,
        success: true,
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'arrêté :", err);
      res.status(500).json({
        data: null,
        success: false,
        error: "Erreur interne du serveur",
      });
    }
  }
);

/**
 * POST /api/arretes/:id/abroger
 * Abrogation d'un arrêté.
 * Requiert le rôle rédacteur ou admin.
 */
router.post(
  "/:id/abroger",
  requireAuth,
  requireRole("redacteur"),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const index = arretes.findIndex((a) => a.id === req.params.id);

      if (index === -1) {
        res.status(404).json({
          data: null,
          success: false,
          error: "Arrêté non trouvé",
        });
        return;
      }

      const existing = arretes[index]!;

      if (existing.statut === "abroge") {
        res.status(400).json({
          data: null,
          success: false,
          error: "Cet arrêté est déjà abrogé",
        });
        return;
      }

      const body = req.body as { motif?: string };

      const arreteAbroge: Arrete = {
        ...existing,
        statut: "abroge",
        arrete_abrogation: {
          numero: `${existing.numero}-ABR`,
          date: new Date().toISOString().slice(0, 10),
          motif: body.motif || "Abrogation sans motif spécifié",
        },
      };

      arretes[index] = arreteAbroge;

      res.json({
        data: arreteAbroge,
        success: true,
      });
    } catch (err) {
      console.error("Erreur lors de l'abrogation :", err);
      res.status(500).json({
        data: null,
        success: false,
        error: "Erreur interne du serveur",
      });
    }
  }
);

export default router;
