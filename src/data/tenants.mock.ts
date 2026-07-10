import type { TenantInfo, User } from "@/types";

export const TENANTS_MOCK: TenantInfo[] = [
  {
    id: "tenant_saint_avoye",
    nom: "Ville de Saint-Avoye",
    code_postal: "56000",
    siren: "215600001",
  },
  {
    id: "tenant_vannes",
    nom: "Ville de Vannes",
    code_postal: "56000",
    siren: "215600002",
  },
  {
    id: "tenant_lorient",
    nom: "Ville de Lorient",
    code_postal: "56100",
    siren: "215601001",
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
