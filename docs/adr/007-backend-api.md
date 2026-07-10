# ADR-007 : Backend API Express

**Date** : 2026-07-10
**Statut** : Accepté
**Décideur** : CTO

## Contexte

Le prototype est frontend-only avec des données en mémoire. Pour supporter des centaines de collectivités avec persistance, authentification et audit, un backend est nécessaire.

## Décision

**Express.js** avec TypeScript, structuré pour une migration future vers un framework plus robuste si nécessaire.

### Pourquoi Express et pas Fastify/NestJS/Go ?

- **Pragmatisme** : l'équipe connaît Express, on livre vite
- **Écosystème** : middleware abondant (helmet, cors, JWT)
- **Migration possible** : la logique métier est dans des services découplés des routes
- **Go envisageable** en v2 si les performances le justifient

### Structure

```
server/
  index.ts          # Point d'entrée, middleware stack
  types.ts          # Extension des types Express (Request augmenté)
  middleware/
    auth.ts         # JWT verification, requireRole()
    tenant.ts       # Extraction X-Tenant-ID
  routes/
    arretes.ts      # CRUD arrêtés
    references.ts   # CRUD références
    auth.ts         # Login/logout/me
  services/
    pdf-arrete.ts   # Génération PDF avec PDFKit
  db/
    schema.sql      # Schéma PostgreSQL avec RLS
    migrations/     # Migrations incrémentales
```

### Sécurité

- Helmet pour les headers HTTP
- CORS configuré par environnement
- JWT avec expiration courte (1h) + refresh token
- Validation des entrées avant traitement
- Audit trail sur chaque opération d'écriture

## Conséquences

- Deux processus en développement : `vite dev` (frontend) + `tsx server/index.ts` (backend)
- Le proxy Vite redirige `/api` vers le backend
- En production : reverse proxy (nginx/Caddy) devant les deux
