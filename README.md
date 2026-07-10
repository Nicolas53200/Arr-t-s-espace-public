# Arrêtés & Espace public

Plateforme territoriale pour la gestion, la cartographie et la diffusion des arrêtés municipaux.

## Fonctionnalités

- **Accueil** avec tableau de bord (arrêtés actifs, historique, références)
- **Création d'arrêtés** par formulaire dynamique (9 types : circulation, stationnement, travaux, manifestation, manifestation sportive, marché, occupation du domaine public, déménagement, alternat) avec support des arrêtés phasés
- **Carte interactive** des impacts sur la voirie (filtres par type, arrêtés en cours et à venir)
- **Calendrier dépliant** sous la carte pour visualiser les arrêtés par mois
- **Basculement automatique en historique** dès expiration de la date de fin
- **Modification** avec historique des versions (motif obligatoire)
- **Abrogation** avec génération automatique d'un arrêté d'abrogation (numéroté)
- **Références permanentes** (délégations de signature, arrêtés permanents) insérées automatiquement dans les visas, avec historique de mise à jour

## Lancement en développement

```bash
npm install
npm run dev
```

L'application sera disponible sur [http://localhost:5173](http://localhost:5173)

## Build pour production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

## Déploiement

Le dossier `dist/` peut être déployé sur n'importe quel hébergeur statique :
- **Vercel** : connecter le dépôt GitHub, framework détecté automatiquement (Vite)
- **Netlify** : connecter le dépôt, build command `npm run build`, publish directory `dist`
- **GitHub Pages** : configurer `vite.config.js` avec `base: '/nom-du-repo/'`

## Structure du projet

```
arretes-espace-public/
├── src/
│   ├── App.jsx        # Composant principal (toute la logique et l'UI)
│   └── main.jsx       # Point d'entrée React
├── index.html         # Page HTML racine (Vite)
├── vite.config.js     # Configuration Vite
├── package.json
└── .gitignore
```

## Stack technique

- **React 18** + **Vite 5**
- **lucide-react** pour les icônes
- Pas de framework CSS — styles inline React pour un contrôle total
- Données en mémoire (état React) — prêt à connecter une API backend

## Prochaines étapes (backend)

Le modèle de données est documenté dans les échanges de conception :
- PostgreSQL + PostGIS pour la voirie et les géométries
- Table `ARRETE`, `ARRETE_VOIE`, `PHASE`, `REFERENCE_PERMANENTE`, `DIFFUSION`
- API REST ou GraphQL à connecter sur les fonctions de publication/lecture
