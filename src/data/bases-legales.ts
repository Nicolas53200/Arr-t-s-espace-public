/**
 * Socle de textes nationaux pré-chargés.
 *
 * Ces références de type "base_legale" sont injectées automatiquement
 * à la création de chaque collectivité. Elles constituent le fondement
 * juridique commun à tous les arrêtés municipaux de police.
 */
import type { Reference } from "@/types";

/**
 * Génère le jeu de bases légales nationales pour une collectivité.
 * Chaque appel produit des IDs uniques pour éviter les collisions
 * quand plusieurs communes coexistent dans le registre.
 */
export function creerBasesLegalesNationales(prefixeId: string): Reference[] {
  const ts = Date.now();
  return [
    {
      id: `${prefixeId}_bl_cgct_2212_1`,
      code: "cgct_l2212_1",
      categorie: "base_legale",
      label: "Code général des collectivités territoriales — Art. L.2212-1 (pouvoir de police du maire)",
      titulaire: null,
      numero: "L.2212-1",
      date: "1996-02-21",
      actif: true,
      date_debut_validite: "1996-02-21",
      date_fin_validite: "",
      historique: [],
    },
    {
      id: `${prefixeId}_bl_cgct_2212_2`,
      code: "cgct_l2212_2",
      categorie: "base_legale",
      label: "Code général des collectivités territoriales — Art. L.2212-2 (police municipale : sûreté, sécurité, salubrité)",
      titulaire: null,
      numero: "L.2212-2",
      date: "1996-02-21",
      actif: true,
      date_debut_validite: "1996-02-21",
      date_fin_validite: "",
      historique: [],
    },
    {
      id: `${prefixeId}_bl_cgct_2212_4`,
      code: "cgct_l2212_4",
      categorie: "base_legale",
      label: "Code général des collectivités territoriales — Art. L.2212-4 (police en cas de danger grave ou imminent)",
      titulaire: null,
      numero: "L.2212-4",
      date: "1996-02-21",
      actif: true,
      date_debut_validite: "1996-02-21",
      date_fin_validite: "",
      historique: [],
    },
    {
      id: `${prefixeId}_bl_cgct_2213_1`,
      code: "cgct_l2213_1",
      categorie: "base_legale",
      label: "Code général des collectivités territoriales — Art. L.2213-1 (police de la circulation et du stationnement)",
      titulaire: null,
      numero: "L.2213-1",
      date: "1996-02-21",
      actif: true,
      date_debut_validite: "1996-02-21",
      date_fin_validite: "",
      historique: [],
    },
    {
      id: `${prefixeId}_bl_code_route_r411_25`,
      code: "cr_r411_25",
      categorie: "base_legale",
      label: "Code de la route — Art. R.411-25 (pouvoir de réglementation du maire sur les voies communales)",
      titulaire: null,
      numero: "R.411-25",
      date: "2001-09-21",
      actif: true,
      date_debut_validite: "2001-09-21",
      date_fin_validite: "",
      historique: [],
    },
    {
      id: `${prefixeId}_bl_code_route_r411_8`,
      code: "cr_r411_8",
      categorie: "base_legale",
      label: "Code de la route — Art. R.411-8 (arrêtés de police de la circulation)",
      titulaire: null,
      numero: "R.411-8",
      date: "2001-09-21",
      actif: true,
      date_debut_validite: "2001-09-21",
      date_fin_validite: "",
      historique: [],
    },
    {
      id: `${prefixeId}_bl_voirie_l116_1`,
      code: "cvr_l116_1",
      categorie: "base_legale",
      label: "Code de la voirie routière — Art. L.116-1 à L.116-8 (coordination des travaux sur la voie publique)",
      titulaire: null,
      numero: "L.116-1 à L.116-8",
      date: "1989-02-07",
      actif: true,
      date_debut_validite: "1989-02-07",
      date_fin_validite: "",
      historique: [],
    },
    {
      id: `${prefixeId}_bl_cspi_l211_1_${ts}`,
      code: "cspi_l211_1",
      categorie: "base_legale",
      label: "Code de la sécurité intérieure — Art. L.211-1 à L.211-4 (maintien de l'ordre lors de manifestations)",
      titulaire: null,
      numero: "L.211-1 à L.211-4",
      date: "2012-05-01",
      actif: true,
      date_debut_validite: "2012-05-01",
      date_fin_validite: "",
      historique: [],
    },
  ];
}
