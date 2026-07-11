// Configuration d'environnement — centralise les variables Vite

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || "/api",
  USE_MOCK: import.meta.env.VITE_USE_MOCK === "true",
} as const;
