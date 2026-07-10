export const ROUTES = {
  accueil: "/",
  actifs: "/actifs",
  carte: "/carte",
  historique: "/historique",
  nouveau: "/nouveau",
  modifier: (id: string) => `/nouveau/${id}`,
  references: "/references",
  login: "/login",
} as const;
