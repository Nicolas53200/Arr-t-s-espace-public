# Actes360

Plateforme SaaS multi-tenant pour la gestion des arretes municipaux par les collectivites francaises.  
Produit edite par **Ignis Nova**.

## Fonctionnalites

- **Landing page** publique avec code d'acces par collectivite
- **Super-admin** Ignis Nova pour gerer les collectivites (creation, activation, codes d'acces)
- **Redaction d'arretes** par formulaire dynamique (9 types : circulation, stationnement, travaux, manifestation, etc.) avec support des arretes phases
- **Workflow de validation** configurable (brouillon, relecture, validation, publication)
- **Cartographie interactive** Leaflet/OpenStreetMap des impacts sur la voirie
- **Generation PDF** avec en-tete officiel de la collectivite (logo, devise, adresse, maire)
- **References permanentes** (delegations de signature, arretes permanents) inserees automatiquement dans les visas
- **Tableau de bord** analytique (statistiques par mois, type, statut, taux d'abrogation)
- **Notifications** (expirations, evenements workflow)
- **Journal d'audit** complet
- **Export CSV** des arretes, references et journal
- **Administration tenant** (gestion utilisateurs, configuration collectivite, upload logo)
- **RBAC** 3 roles : admin, redacteur, lecteur
- **Responsive** mobile avec menu hamburger

## Stack technique

- **Frontend** : React 18 + TypeScript strict + Vite 5
- **Routing** : React Router v6
- **State** : React Context + useReducer (par domaine)
- **Backend** : Express.js + JWT + helmet + CORS
- **PDF** : PDFKit (serveur) + apercu HTML (client)
- **Carte** : Leaflet + react-leaflet + OpenStreetMap
- **Tests** : Vitest + Testing Library
- **CI** : GitHub Actions (typecheck + tests + build)
- **Icones** : lucide-react
- **Styles** : CSS custom properties + inline styles

## Structure du projet

```
src/
  types/          # Types du domaine metier (Arrete, Reference, User...)
  config/         # Constantes, theme, routes, env
  data/           # Donnees mock typees
  lib/            # Logique metier pure (workflow, validation, analytics, export, PDF)
  services/       # Couche API abstraite (mock / backend)
  contexts/       # Providers React (Auth, Tenant, Arretes, References, Notifications, Audit, Toast)
  hooks/          # Custom hooks (useMediaQuery, useFormValidation)
  components/     # Composants UI et metier
  pages/          # 15 pages (une par route)
  styles/         # CSS global + variables
  __tests__/      # Tests unitaires et composants
server/
  routes/         # API REST (arretes, references, auth, admin, audit, notifications)
  middleware/     # Auth JWT + tenant isolation
  services/       # Generation PDF serveur
  db/             # Schema PostgreSQL + RLS + migrations
docs/adr/         # Architecture Decision Records
```

## Demarrage rapide

```bash
npm install --legacy-peer-deps
npm run dev
```

L'application sera disponible sur [http://localhost:5173](http://localhost:5173).

### Comptes de demo

| Email | Mot de passe | Role |
|---|---|---|
| admin@saint-avoye.fr | admin123 | Administrateur |
| redacteur@saint-avoye.fr | redac123 | Redacteur |
| lecteur@saint-avoye.fr | lect123 | Lecteur |

Code d'acces demo : `SAINT-AVOYE-2026`  
Code super-admin : `IGNISNOVA`

## Commandes

```bash
npm run dev        # Serveur de developpement
npm run build      # Build production
npm run test       # Tests unitaires
npm run test:watch # Tests en mode watch
npm run typecheck  # Verification TypeScript
npm run server     # Backend Express (port 3001)
```

## Architecture

### Multi-tenant

- `TenantContext` fournit l'identite de la collectivite
- Header `X-Tenant-ID` sur chaque requete API
- Schema PostgreSQL avec Row-Level Security (RLS)
- Provisioning instantane via le panel super-admin

### RBAC

- 3 roles : `admin`, `redacteur`, `lecteur`
- `useAuth().can("arrete:edit")` pour verifier les droits
- Matrice de permissions dans `src/lib/permissions.ts`

### Workflow

```
brouillon -> en_relecture -> valide -> publie -> modifie -> publie
                  |                       |
                  v                       v
              brouillon               abroge
```

## Documentation

Les decisions architecturales sont documentees dans `docs/adr/` :

- ADR-001 : Architecture SaaS multi-tenant
- ADR-002 : Architecture frontend
- ADR-003 : Modele RBAC
- ADR-004 : Strategie de tests
- ADR-005 : Cartographie Leaflet
- ADR-006 : Generation PDF
- ADR-007 : Backend API
