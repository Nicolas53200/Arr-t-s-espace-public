# ADR-005 : Cartographie Leaflet + OpenStreetMap

**Date** : 2026-07-10
**Statut** : Accepté
**Décideur** : CTO

## Contexte

Le prototype utilise un SVG statique de 14 voies fictives. Cela ne tient pas face à une vraie commune avec des centaines de rues. Les collectivités ont besoin de visualiser les impacts sur un plan géographique réel.

## Décision

Remplacement du SVG par **Leaflet** + **OpenStreetMap** (via react-leaflet).

### Pourquoi Leaflet et pas Mapbox/Google Maps ?

- **Gratuit** : pas de clé API, pas de facturation à l'usage
- **Open source** : pas de dépendance à un fournisseur
- **Léger** : ~40 Ko gzippé
- **Compatible IGN** : les tuiles Géoportail peuvent être utilisées en remplacement d'OSM

### Architecture

- `CarteLeaflet.tsx` : composant React wrappant Leaflet
- Les tronçons d'arrêtés sont dessinés comme des polylines colorées
- Le clic sur un tronçon ouvre un popup avec les arrêtés associés
- Le composant SVG original (`CarteImpacts.tsx`) reste disponible comme fallback

### Migration future

- Intégrer la **Base Adresse Nationale (BAN)** pour le géocodage des voies
- Utiliser les tuiles **IGN Géoportail** pour un rendu plus précis
- Ajouter le dessin de zones (polygones) pour les places et parkings

## Conséquences

- Dépendance à `leaflet` + `react-leaflet` (~80 Ko gzippé total)
- Le CSS Leaflet doit être importé (`leaflet/dist/leaflet.css`)
- Les coordonnées des voies doivent être renseignées (manuellement ou via BAN)
