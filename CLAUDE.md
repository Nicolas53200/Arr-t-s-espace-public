# Arrêtés & Espace Public — SaaS Platform

## Architecture

Plateforme SaaS multi-tenant pour la gestion des arrêtés municipaux par les collectivités françaises.

### Stack

- **Frontend** : React 18 + TypeScript strict + Vite
- **Routing** : React Router v6
- **State** : React Context + useReducer (par domaine)
- **Tests** : Vitest + Testing Library
- **Styles** : CSS custom properties + fichiers CSS

### Structure

```
src/
  types/          # Types du domaine métier (Arrete, Reference, User...)
  config/         # Constantes, thème, routes
  data/           # Données mock typées
  lib/            # Logique métier pure (testable sans React)
  services/       # Couche API abstraite (mock → backend)
  contexts/       # Providers React (Auth, Tenant, Arretes, References)
  hooks/          # Custom hooks
  components/     # Composants UI et métier
  pages/          # Pages (une par route)
  styles/         # CSS global + variables
  __tests__/      # Tests (miroir de src/)
docs/adr/         # Architecture Decision Records
```

### Multi-tenant

- `TenantContext` fournit l'identité de la collectivité
- Header `X-Tenant-ID` sur chaque requête API
- Future : Row-Level Security PostgreSQL

### RBAC

- 3 rôles : `admin`, `redacteur`, `lecteur`
- `useAuth().can("arrete:edit")` pour vérifier les droits
- Matrice dans `src/lib/permissions.ts`

## Commandes

```bash
npm run dev        # Serveur de développement
npm run build      # Build production
npm run test       # Tests unitaires
npm run test:watch # Tests en mode watch
npm run typecheck  # Vérification TypeScript
```

## Conventions

- TypeScript strict, pas de `any`
- Tests en français (domaine métier français)
- Un composant par fichier
- Imports via alias `@/` (résolu vers `src/`)
- ADR dans `docs/adr/` pour chaque décision architecturale
