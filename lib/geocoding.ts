/**
 * Precise registry of known premium buildings in Nairobi.
 */
const KNOWN_BUILDINGS: Record<string, { lat: number; lng: number }> = {
  "88 TOWERS": { lat: -1.2988, lng: 36.8193 },
  "RIARA ONE": { lat: -1.2917, lng: 36.7833 },
  "RIARA ONE TOWERS": { lat: -1.2917, lng: 36.7833 },
  "GLOBAL TRADE CENTER": { lat: -1.2667, lng: 36.8000 },
  "GTC": { lat: -1.2667, lng: 36.8000 },
};

/**
 * Hardcoded registry of districts for reliable fallback geocoding.
 */
const LOCATION_REGISTRY: Record<string, { lat: number; lng: number }> = {
  // Nairobi
  "UPPER HILL": { lat: -1.2988, lng: 36.8193 },
  "KILIMANI": { lat: -1.2917, lng: 36.7833 },
  "KILELESHWA": { lat: -1.2833, lng: 36.7833 },
  "KILLESHWA": { lat: -1.2833, lng: 36.7833 }, // Typo fallback
  "KILELESHWA DISTRICT": { lat: -1.2833, lng: 36.7833 },
  "WESTLANDS": { lat: -1.2667, lng: 36.8000 },
  "LAVINGTON": { lat: -1.2783, lng: 36.7725 },
  "KAREN": { lat: -1.3167, lng: 36.7000 },
  "MUTHAIGA": { lat: -1.2500, lng: 36.8333 },
  "PARKLANDS": { lat: -1.2611, lng: 36.8167 },
  "GIGIRI": { lat: -1.2333, lng: 36.8167 },
  "CBD": { lat: -1.2833, lng: 36.8167 },
  
  // Miami / Florida (Based on user screenshots)
  "HOLLYWOOD": { lat: 26.0112, lng: -80.1495 },
  "HIALEAH": { lat: 25.8576, lng: -80.2781 },
  "NORTH MIAMI": { lat: 25.8901, lng: -80.1867 },
  "AVENTURA": { lat: 25.9565, lng: -80.1392 },
  "SUNNY ISLES": { lat: 25.9429, lng: -80.1234 },
  "MIAMI BEACH": { lat: 25.7907, lng: -80.1300 }
};

/**
 * Extracts latitude and longitude from a Google Maps URL.
 */
export function extractCoordsFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  
  // 1. Regex for @lat,lng format
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  // 2. Regex for search/place/dir path format
  const pathMatch = url.match(/\/(?:search|place|dir)\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (pathMatch) return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };

  // 3. Regex for 3d/4d hex format
  const hexMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (hexMatch) return { lat: parseFloat(hexMatch[1]), lng: parseFloat(hexMatch[2]) };

  return null;
}

/**
 * High-precision search for building coordinates.
 * Priority: 1. Building Name Registry -> 2. District Registry -> 3. (Optional) Dynamic API
 */
export function getCoordsBySearch(buildingName: string = "", district: string = "", county: string = "Nairobi"): { lat: number; lng: number } | null {
  const normBuilding = buildingName?.toUpperCase().trim();
  const normDistrict = district?.toUpperCase().trim();

  // Tier 1: Check Known Buildings Registry
  if (normBuilding && KNOWN_BUILDINGS[normBuilding]) {
    return KNOWN_BUILDINGS[normBuilding];
  }

  // Tier 2: Check for Building Name in Registry (Partial Match)
  if (normBuilding) {
    for (const [key, coords] of Object.entries(KNOWN_BUILDINGS)) {
      if (normBuilding.includes(key) || key.includes(normBuilding)) {
        return coords;
      }
    }
  }

  // Tier 3: District Fallback
  if (normDistrict && LOCATION_REGISTRY[normDistrict]) {
    return LOCATION_REGISTRY[normDistrict];
  }

  return null;
}

/**
 * Performs a real-time search using Nominatim (OpenStreetMap)
 * Use sparingly to avoid rate limiting.
 */
export async function searchBuildingDynamic(buildingName: string, district: string, county: string = "Nairobi"): Promise<{ lat: number; lng: number } | null> {
  if (!buildingName) return null;
  
  const query = `${buildingName}, ${district}, ${county}, Kenya`;
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      headers: {
        'User-Agent': 'KaaraRealtyGroup/1.0'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (err) {
    console.error("Dynamic geocoding error:", err);
  }
  return null;
}
