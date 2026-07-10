# ADR-003 : Modèle RBAC (contrôle d'accès par rôles)

**Date** : 2026-07-10
**Statut** : Accepté
**Décideur** : CTO

## Contexte

Les utilisateurs ont des responsabilités différentes : certains rédigent les arrêtés, d'autres les consultent seulement, les administrateurs gèrent la configuration. Le système de droits doit être simple à comprendre et à auditer.

## Décision

Trois rôles avec des permissions fixes :

### `admin`
Accès complet : gestion des arrêtés, des références permanentes, des utilisateurs et des paramètres.

### `redacteur`
Peut créer, modifier, abroger et publier des arrêtés. Peut consulter les références mais pas les modifier.

### `lecteur`
Consultation uniquement. Pas de modification possible.

### Permissions

| Permission | admin | redacteur | lecteur |
|---|---|---|---|
| `arrete:create` | x | x | |
| `arrete:edit` | x | x | |
| `arrete:abrogate` | x | x | |
| `arrete:publish` | x | x | |
| `arrete:view` | x | x | x |
| `arrete:view_history` | x | x | x |
| `reference:create` | x | | |
| `reference:edit` | x | | |
| `reference:view` | x | x | x |
| `settings:manage` | x | | |
| `users:manage` | x | | |

### Implémentation

- `src/lib/permissions.ts` : matrice rôle → permissions
- `src/contexts/AuthContext.tsx` : expose `can(permission)` via hook
- Les composants vérifient `can("arrete:edit")` avant d'afficher les boutons d'action

## Conséquences

- Extension future facile : ajouter un rôle `superviseur` = une ligne dans la matrice
- Pas de permissions granulaires par arrêté (trop complexe à ce stade)
- Les rôles sont par tenant : un utilisateur est `admin` d'une collectivité, pas de toutes
