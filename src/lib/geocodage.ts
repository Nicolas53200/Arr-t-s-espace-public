/**
 * Service de géocodage basé sur l'API Adresse du gouvernement français.
 *
 * https://adresse.data.gouv.fr/api-doc/adresse
 *
 * Utilisé pour :
 * - Trouver le centre d'une commune (à la création de collectivité)
 * - Rechercher des rues dans une commune (autocomplétion)
 */

const BASE_URL = "https://api-adresse.data.gouv.fr";

// ──── Types ────

export interface ResultatGeocodage {
  label: string;
  nom: string;
  code_postal: string;
  commune: string;
  lat: number;
  lng: number;
  type: "housenumber" | "street" | "locality" | "municipality";
}

interface FeatureAdresse {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
    type: string;
  };
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
}

interface ReponseAdresse {
  features: FeatureAdresse[];
}

// ──── Géocoder une commune ────

/**
 * Géocode une commune par son nom et code postal.
 * Retourne les coordonnées [lat, lng] du centre-ville.
 */
export async function geocoderCommune(
  nom: string,
  codePostal: string,
): Promise<[number, number] | null> {
  try {
    // Nettoyer le nom (retirer "Ville de", "Commune de", etc.)
    const nomNettoye = nom
      .replace(/^(Ville|Commune|Mairie)\s+d[eu']\s*/i, "")
      .trim();

    const params = new URLSearchParams({
      q: nomNettoye,
      postcode: codePostal,
      type: "municipality",
      limit: "1",
    });

    const res = await fetch(`${BASE_URL}/search/?${params}`);
    if (!res.ok) return null;

    const data: ReponseAdresse = await res.json();
    if (data.features.length === 0) {
      // Fallback : chercher sans le type municipality
      const params2 = new URLSearchParams({
        q: `${nomNettoye} ${codePostal}`,
        limit: "1",
      });
      const res2 = await fetch(`${BASE_URL}/search/?${params2}`);
      if (!res2.ok) return null;
      const data2: ReponseAdresse = await res2.json();
      if (data2.features.length === 0) return null;
      const [lng, lat] = data2.features[0]!.geometry.coordinates;
      return [lat, lng];
    }

    const [lng, lat] = data.features[0]!.geometry.coordinates;
    return [lat, lng];
  } catch {
    return null;
  }
}

// ──── Rechercher des rues dans une commune ────

/**
 * Recherche des rues dans une commune spécifique.
 * Utilise le code postal pour limiter les résultats à la bonne ville.
 */
export async function rechercherRues(
  query: string,
  codePostal: string,
  limite: number = 5,
): Promise<ResultatGeocodage[]> {
  if (query.length < 2) return [];

  try {
    // Recherche large (sans restriction de type) pour trouver rues, places, lieux-dits…
    const params = new URLSearchParams({
      q: query,
      postcode: codePostal,
      limit: String(limite),
      autocomplete: "1",
    });

    const res = await fetch(`${BASE_URL}/search/?${params}`);
    if (!res.ok) return [];

    const data: ReponseAdresse = await res.json();
    // Filtrer les résultats de type municipality (on cherche des voies, pas des communes)
    return data.features
      .filter((f) => f.properties.type !== "municipality")
      .map((f) => ({
        label: f.properties.label,
        nom: f.properties.name,
        code_postal: f.properties.postcode,
        commune: f.properties.city,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        type: f.properties.type as ResultatGeocodage["type"],
      }));
  } catch {
    return [];
  }
}
