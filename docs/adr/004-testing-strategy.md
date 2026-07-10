# ADR-004 : Stratégie de tests

**Date** : 2026-07-10
**Statut** : Accepté
**Décideur** : CTO

## Contexte

Le prototype n'avait aucun test. Pour une plateforme qui gère des actes réglementaires, la fiabilité est critique. Un arrêté publié avec des données erronées a des conséquences juridiques.

## Décision

### Pyramide de tests

1. **Tests unitaires** (`src/__tests__/lib/`) : logique métier pure
   - Calcul de statuts, formatage de dates, RBAC, résolution de voies
   - Rapides, sans dépendances

2. **Tests de composants** (`src/__tests__/components/`) : composants React isolés
   - Rendu correct, interactions utilisateur, respect du RBAC
   - Avec `@testing-library/react`

3. **Tests d'intégration** (`src/__tests__/pages/`) : pages complètes
   - Flux wizard de création d'arrêté
   - Navigation entre vues

### Outils

- **Vitest** : rapide, natif ESM, compatible Vite
- **@testing-library/react** : tests centrés sur l'utilisateur
- **jsdom** : environnement DOM pour les tests

### Conventions

- Un fichier de test par module : `lib/date.ts` → `__tests__/lib/date.test.ts`
- Noms de tests en français (domaine métier français)
- `describe` par fonction, `it` par cas

## Conséquences

- CI doit bloquer le merge si un test échoue
- Objectif : 80% de couverture sur `src/lib/`
- Les tests de composants couvrent les cas RBAC (boutons masqués pour lecteur)
