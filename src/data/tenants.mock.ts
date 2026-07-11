import type { TenantInfo, User } from "@/types";

export const TENANTS_MOCK: TenantInfo[] = [
  {
    id: "tenant_saint_avoye",
    nom: "Ville de Saint-Avoye",
    code_postal: "56000",
    siren: "215600001",
    adresse: "1 Place de la Mairie, 56000 Saint-Avoye",
    telephone: "02 97 00 00 00",
    email_contact: "mairie@saint-avoye.fr",
    devise: "Liberté, Égalité, Fraternité",
    nom_maire: "M. Jean-Pierre Martin",
    titre_maire: "Le Maire",
  },
  {
    id: "tenant_vannes",
    nom: "Ville de Vannes",
    code_postal: "56000",
    siren: "215600002",
    adresse: "Place Maurice Marchais, 56000 Vannes",
    nom_maire: "Mme Anne Dupont",
    titre_maire: "Le Maire",
  },
  {
    id: "tenant_lorient",
    nom: "Ville de Lorient",
    code_postal: "56100",
    siren: "215601001",
    adresse: "2 Boulevard Leclerc, 56100 Lorient",
    nom_maire: "M. Philippe Durand",
    titre_maire: "Le Maire",
  },
];

export const USERS_MOCK: User[] = [
  {
    id: "u1",
    nom: "M. Lefèvre",
    email: "lefevre@saint-avoye.fr",
    role: "redacteur",
    tenant_id: "tenant_saint_avoye",
  },
  {
    id: "u2",
    nom: "Mme Bernard",
    email: "bernard@saint-avoye.fr",
    role: "redacteur",
    tenant_id: "tenant_saint_avoye",
  },
  {
    id: "u3",
    nom: "Admin SaaS",
    email: "admin@arretes-saas.fr",
    role: "admin",
    tenant_id: "tenant_saint_avoye",
  },
  {
    id: "u4",
    nom: "M. Dupont (Lecteur)",
    email: "dupont@saint-avoye.fr",
    role: "lecteur",
    tenant_id: "tenant_saint_avoye",
  },
];
