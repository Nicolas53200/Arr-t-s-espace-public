# ADR-006 : Génération PDF des arrêtés

**Date** : 2026-07-10
**Statut** : Accepté
**Décideur** : CTO

## Contexte

Un arrêté municipal est un acte administratif officiel qui doit être diffusé sous forme de document PDF conforme. Le prototype ne génère aucun document.

## Décision

Génération PDF côté serveur avec **PDFKit**.

### Pourquoi côté serveur et pas côté client ?

- Le PDF est un acte officiel : il doit être généré de manière déterministe
- Archivage centralisé (stockage S3/fichiers)
- Signature électronique future (nécessite le serveur)
- Pas de dépendance au navigateur de l'utilisateur

### Structure du PDF

1. En-tête : République Française + nom de la collectivité
2. Numéro et titre de l'arrêté
3. Visas : références permanentes insérées automatiquement
4. Considérants
5. Articles : période, voies concernées, mesures
6. Signature : par délégation du Maire
7. Pied de page : numéro + collectivité

### Pourquoi PDFKit et pas Puppeteer/wkhtmltopdf ?

- **Léger** : pas de navigateur headless à installer
- **Contrôle fin** : chaque élément est positionné programmatiquement
- **Rapide** : génération en <100ms vs ~2s pour Puppeteer
- **Pas de dépendance système** : tourne partout où Node.js tourne

## Conséquences

- Le PDF n'est pas un rendu HTML : le design est codé dans le service
- Les mises en page complexes (tableaux, images) nécessitent plus de code
- Migration future vers une solution HTML→PDF possible si nécessaire
