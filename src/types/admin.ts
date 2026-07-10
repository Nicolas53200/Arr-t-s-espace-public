export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "redacteur" | "lecteur";
  actif: boolean;
  derniere_connexion?: string;
  date_creation: string;
}

export interface ConfigTenant {
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
