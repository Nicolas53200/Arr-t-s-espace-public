# ADR-002 : Architecture frontend

**Date** : 2026-07-10
**Statut** : Accepté
**Décideur** : CTO

## Contexte

Le prototype initial est un fichier unique de 1 223 lignes (App.jsx) sans routage, sans types, sans tests. Il faut le transformer en une base de code modulaire, maintenable sur 10+ ans.

## Décisions

### TypeScript strict

- `strict: true`, `noUncheckedIndexedAccess: true`
- Chaque entité métier typée dans `src/types/`
- Pas de `any`

### React Router v6

- Remplacement du `useState("vue")` par des routes URL
- Permet le deep linking, le back/forward navigateur, le bookmarking
- Layout partagé via `<Outlet />`

### Context + useReducer (pas Redux)

- L'état de l'application est modeste : ~50 arrêtés, ~10 références
- React Context suffit, pas besoin d'une bibliothèque externe
- Un contexte par domaine : `ArretesContext`, `ReferencesContext`, `AuthContext`, `TenantContext`

### Couche API abstraite

- `src/services/` définit des fonctions async typées
- Implémentation mock en mémoire pour le développement
- Quand le backend arrive : on remplace l'import, pas le code appelant

### CSS extrait en fichiers

- Variables CSS (custom properties) pour les design tokens
- Fichier global pour les classes utilitaires
- Pas de CSS-in-JS : complexité inutile pour cette application

### Structure de composants en 3 niveaux

1. `components/common/` : composants UI génériques (Button, Badge, Modal)
2. `components/{domaine}/` : composants métier (ArreteLigne, CarteImpacts)
3. `pages/` : assemblage final, une page = une route

## Conséquences

- Onboarding d'un nouveau développeur : lire `types/domain.ts` pour comprendre le métier
- Ajout d'une fonctionnalité : créer un composant dans le bon dossier, l'importer dans la page
- Migration backend : toucher uniquement `services/`
