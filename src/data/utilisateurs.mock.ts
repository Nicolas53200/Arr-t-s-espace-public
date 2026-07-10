import type { Utilisateur } from "@/types";

export const UTILISATEURS_MOCK: Utilisateur[] = [
  {
    id: "u1",
    nom: "M. Lefevre",
    email: "lefevre@saint-avoye.fr",
    role: "redacteur",
    actif: true,
    derniere_connexion: "2026-07-10T08:00:00",
    date_creation: "2025-03-15",
  },
  {
    id: "u2",
    nom: "Mme Bernard",
    email: "bernard@saint-avoye.fr",
    role: "redacteur",
    actif: true,
    derniere_connexion: "2026-07-09T14:30:00",
    date_creation: "2025-03-15",
  },
  {
    id: "u3",
    nom: "Admin SaaS",
    email: "admin@arretes-saas.fr",
    role: "admin",
    actif: true,
    derniere_connexion: "2026-07-10T07:45:00",
    date_creation: "2025-01-01",
  },
  {
    id: "u4",
    nom: "M. Dupont",
    email: "dupont@saint-avoye.fr",
    role: "lecteur",
    actif: true,
    derniere_connexion: "2026-07-08T09:00:00",
    date_creation: "2025-06-01",
  },
  {
    id: "u5",
    nom: "Mme Moreau",
    email: "moreau@saint-avoye.fr",
    role: "lecteur",
    actif: false,
    derniere_connexion: "2026-04-15T16:00:00",
    date_creation: "2025-09-10",
  },
];
