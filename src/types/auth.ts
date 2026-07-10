export type Role = "admin" | "redacteur" | "lecteur";

export type Permission =
  | "arrete:create"
  | "arrete:edit"
  | "arrete:abrogate"
  | "arrete:publish"
  | "arrete:view"
  | "arrete:view_history"
  | "reference:create"
  | "reference:edit"
  | "reference:view"
  | "settings:manage"
  | "users:manage"
  | "admin:manage";

export interface User {
  id: string;
  nom: string;
  email: string;
  role: Role;
  tenant_id: string;
}

export interface TenantInfo {
  id: string;
  nom: string;
  code_postal: string;
  siren: string;
}
