# ADR 008 — Intégrations externes

## Statut

Accepté — 2026-08-09

## Contexte

Les collectivités territoriales françaises sont soumises à des obligations légales de télétransmission des actes administratifs au contrôle de légalité (Préfecture), de publication en open data, et utilisent des outils de signature électronique (iParapheur). La plateforme doit s'intégrer avec ces systèmes pour offrir une solution complète.

## Décision

Six intégrations sont implémentées avec une architecture extensible :

### Intégrations

| Code | Nom | Description |
|------|-----|-------------|
| `actes_tdt` | ACTES / TDT | Télétransmission au contrôle de légalité via le protocole ACTES |
| `open_data` | Open Data | Publication sur data.gouv.fr (formats JSON/CSV, licence LO 2.0 ou ODbL) |
| `iparapheur` | iParapheur | Signature électronique (simple, avancée RGS**, qualifiée eIDAS) |
| `ical` | Calendrier iCal | Flux CalDAV des arrêtés pour les agents terrain |
| `webhooks` | Webhooks | Notifications HTTP temps réel avec signature HMAC-SHA256 |
| `smtp` | Email / SMTP | Configuration du serveur de messagerie |

### Architecture

```
types/integration.ts      # Types du domaine (30+ interfaces)
lib/integrations.ts       # Logique métier pure (formatage, validation, génération)
services/integrations.service.ts  # Service mock avec localStorage
pages/IntegrationsPage.tsx # Page de gestion complète
```

### Principes

1. **Logique métier pure** — Les fonctions de formatage (ACTES XML, Open Data, iCal) sont dans `lib/integrations.ts`, testables sans React ni DOM.
2. **Validation stricte** — Chaque type d'intégration a sa fonction de validation avec des messages d'erreur localisés en français.
3. **Service abstrait** — `IntegrationsService` utilise localStorage en mode mock, prêt à basculer vers l'API REST sans changement côté UI.
4. **Historique de transmission** — Chaque synchronisation génère une entrée d'historique avec statut, code retour, et message d'erreur.
5. **Classification ACTES** — Table de mapping automatique `type_code → classification ACTES` (voirie → 5, police → 3, etc.)

### Classification ACTES

Les arrêtés sont automatiquement classifiés selon la nomenclature ACTES :
- Matière 3 (Police) : manifestations, nuisances sonores, péril, débits de boissons
- Matière 5 (Domaine/Voirie) : circulation, stationnement, travaux, piétonnisation
- Matière 9 (Autres) : types non classifiés

### Webhooks

- Signature HMAC-SHA256 de chaque payload
- 7 événements : `arrete.cree`, `.modifie`, `.publie`, `.abroge`, `.expire`, `reference.modifiee`, `.expiree`
- Filtrage par endpoint et par événement
- Toggle actif/inactif par endpoint

### iCal

- Format RFC 5545 conforme
- Statut VEVENT : `CONFIRMED` (publié), `TENTATIVE` (brouillon), `CANCELLED` (abrogé)
- Support VALARM pour les rappels configurables

## Conséquences

- **55 tests unitaires** couvrent la logique métier (validation, formatage, génération)
- La page Intégrations est accessible aux administrateurs uniquement (RBAC)
- Les configurations sont persistées en localStorage (mode mock)
- L'audit log trace les activations/désactivations d'intégrations
- Architecture prête pour le backend : remplacer `IntegrationsService` par des appels API REST
