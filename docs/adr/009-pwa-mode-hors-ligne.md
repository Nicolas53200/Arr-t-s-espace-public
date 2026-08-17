# ADR 009 — PWA et mode hors-ligne

**Date** : 2026-08-10  
**Statut** : Accepté  
**Auteurs** : Équipe Actes360

## Contexte

Les agents municipaux utilisent l'application sur le terrain (voirie, marchés, chantiers) où la connectivité réseau est souvent dégradée ou inexistante. La perte de données saisies en mobilité représente un risque opérationnel majeur.

## Décision

Implémenter une Progressive Web App (PWA) avec :

1. **Service Worker** (`public/sw.js`) — Stratégies de cache différenciées :
   - **Cache-first** pour les ressources statiques (JS, CSS, images, assets Vite)
   - **Network-first** pour les appels API (`/api/`) avec fallback cache
   - **Network-first** pour la navigation avec fallback vers `/` (SPA)
   - Pré-cache des ressources critiques à l'installation
   - Nettoyage automatique des anciens caches à l'activation

2. **File de synchronisation** (`src/lib/offline.ts`) — IndexedDB via deux object stores :
   - `sync_queue` : actions CRUD en attente (création, modification, suppression)
   - `data_cache` : données consultées en lecture seule
   - Synchronisation FIFO avec maximum 5 tentatives par action
   - Support de la Background Sync API (`sync-arretes`)

3. **Détection de connectivité** (`src/hooks/useConnectivite.ts`) :
   - Écoute des événements `online` / `offline`
   - Synchronisation automatique au retour en ligne
   - Compteur d'actions en attente en temps réel

4. **Indicateurs visuels** :
   - `IndicateurConnexion` : barre d'état fixe en bas (hors-ligne / retour en ligne)
   - `BanniereMiseAJour` : notification de nouvelle version du Service Worker
   - `InvitePWA` : invite d'installation avec cooldown de 24h après rejet

5. **Manifest** (`public/manifest.json`) :
   - Mode `standalone`, thème `#1E3A5F`
   - Raccourcis vers les pages fréquentes (arrêtés actifs, nouveau, carte)
   - Icônes SVG 192×192 et 512×512

## Alternatives rejetées

| Alternative | Raison du rejet |
|---|---|
| Workbox (Google) | Dépendance lourde, le SW manuel suffit pour nos stratégies simples |
| localStorage pour le cache | Limité à 5-10 Mo, pas adapté aux données structurées volumineuses |
| Cache API seule (sans IndexedDB) | Pas adaptée au stockage de données métier structurées (actions en attente) |
| Application native (React Native) | Coût de maintenance double, PWA couvre les besoins terrain |

## Conséquences

### Positives
- Utilisation possible sans réseau (consultation des données cachées, saisie différée)
- Installation sur l'écran d'accueil (mobile et desktop)
- Synchronisation transparente au retour en ligne
- Mises à jour automatiques via le Service Worker

### Négatives
- Complexité de gestion des conflits de synchronisation (résolution manuelle future)
- IndexedDB API verbeuse (encapsulée dans `offline.ts`)
- Le Service Worker nécessite HTTPS en production
- Quota de stockage variable selon les navigateurs (~50-100 Mo)

### Risques
- Les données en cache peuvent devenir obsolètes → timestamp + invalidation future
- Les conflits de modification concurrente ne sont pas encore gérés → ADR futur
- Safari a des limitations sur le Background Sync → fallback sur synchro au focus

## Structure des fichiers

```
public/
  manifest.json           # Manifest PWA
  sw.js                   # Service Worker
  icons/
    icon-192.svg          # Icône PWA 192×192
    icon-512.svg          # Icône PWA 512×512
src/
  lib/offline.ts          # IndexedDB + file de synchronisation
  hooks/useConnectivite.ts # Hook React connectivité + synchro
  components/common/
    IndicateurConnexion.tsx # Barre d'état connexion + bannière MAJ
    InvitePWA.tsx          # Invite d'installation
```
