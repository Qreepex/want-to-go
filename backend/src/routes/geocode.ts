import { Router } from "express";
import redis from "../cache/client.js";
import { getCoordinatesDataKey, getGeocodeCacheKey, roundCoordinate } from "../lib/coordinates.js";
import { NominatimAddress, UnifiedGeocodeResult } from "../lib/types.js";
import { geocodeRateLimiter } from "../middleware/rate-limit.js";

const geocodeRouter = Router();

geocodeRouter.use(geocodeRateLimiter);

const CACHE_TTL = 60 * 60 * 24 * 30; // 30 Tage in Sekunden

const RADIUS_METERS = 50; // Suchr

let apiIndex = 0;

function getNextApiIndex(): number {
  apiIndex = (apiIndex + 1) % 2;
  return apiIndex;
}

function getRegionName(
  address: NominatimAddress | undefined,
  fallback: string,
): string {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.hamlet ??
    address?.suburb ??
    address?.neighbourhood ??
    address?.county ??
    address?.state ??
    address?.region ??
    address?.province ??
    address?.country ??
    fallback
  );
}

geocodeRouter.get("/search", async (request, response) => {
  const query =
    typeof request.query.q === "string" ? request.query.q.trim() : "";

  if (!query) {
    response.status(400).json({ error: "Query is required" });
    return;
  }

  const searchQueryKey = getGeocodeCacheKey(query);
  try {
    // 1. Schau nach, ob dieser Suchbegriff bereits auf eine Location-ID verweist
    const cachedLocationIds = await redis.lrange(searchQueryKey, 0, -1);

    if (cachedLocationIds && cachedLocationIds.length > 0) {
      // Parallel alle Daten-Hashes aus Redis abfragen
      const hashResults = await Promise.all(
        cachedLocationIds.map((id) => redis.hgetall(`geo:data:${id}`)),
      );

      // Filtern, falls ein Cache-Eintrag unvollständig oder abgelaufen sein sollte
      const validResults = hashResults
        .filter((hash) => hash && hash.name)
        .map((hash) => ({
          name: hash.name,
          displayName: hash.displayName,
          latitude: Number(hash.latitude),
          longitude: Number(hash.longitude),
          countryCode: hash.countryCode || undefined,
        }));

      if (validResults.length > 0) {
        return response.json({ results: validResults }); // Cache Hit für die gesamte Liste!
      }
    }
  } catch (err) {
    console.error("Error accessing Redis cache:", err);
    response.status(500).json({ error: "Internal server error" });
    return;
  }

  // 2. Cache-Miss: API-Rotation bestimmen
  const apiIndex = await getNextApiIndex();
  let results: UnifiedGeocodeResult[] = [];
  let success = false;

  // Array von Funktionen für einfacheren Fallback, falls eine API fehlschlägt
  const providers = [
    // Index 0: Nominatim
    async () => {
      const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
      searchUrl.searchParams.set("format", "jsonv2");
      searchUrl.searchParams.set("addressdetails", "1");
      searchUrl.searchParams.set("limit", "8");
      searchUrl.searchParams.set("q", query);

      console.debug("Nominatim search URL:", searchUrl.toString());
      const res = await fetch(searchUrl, {
        headers: {
          "user-agent": "WantToGo/1.0 (https://go.schiemann.work)",
          Referer: "https://go.schiemann.work",
        },
      });
      if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
      const data = (await res.json()) as any[];
      return data.map((entry) => ({
        name: entry.name ?? entry.display_name ?? query,
        displayName: entry.display_name ?? entry.name ?? query,
        latitude: Number(entry.lat),
        longitude: Number(entry.lon),
        countryCode: entry.address?.country_code?.toUpperCase(),
      }));
    },
    // Index 1: Photon (Komoot)
    async () => {
      const searchUrl = new URL("https://photon.komoot.io/api/");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("limit", "8");

      console.debug("Photon search URL:", searchUrl.toString());
      const res = await fetch(searchUrl);
      if (!res.ok) throw new Error(`Photon error ${res.status}`);
      const data = (await res.json()) as { features: any[] };
      return data.features.map((feature) => {
        const props = feature.properties;
        const name = props.name ?? props.city ?? props.country ?? query;
        const displayParts = [
          props.name,
          props.city,
          props.postcode,
          props.country,
        ].filter(Boolean);
        return {
          name: name,
          displayName: displayParts.join(", ") || name,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          countryCode: props.countrycode?.toUpperCase(),
        };
      });
    },
  ];

  // Relevante Provider-Reihenfolge ab dem gewählten Index erstellen
  const order = [apiIndex, ...providers.keys()].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  for (const idx of order) {
    try {
      if (providers[idx]) {
        results = await providers[idx]();
        success = true;
        break;
      }
    } catch (err) {
      console.warn(`Provider Index ${idx} failed, trying next...`, err);
    }
  }

  if (!success || !results || results.length === 0) {
    return response
      .status(502)
      .json({ error: "All geocoding services failed" });
  }

  // 3. In Redis cachen & absenden
  try {
    // Wir nutzen eine Pipeline, um alle Redis-Befehle atomar in einem Rutsch zu senden
    const pipeline = redis.pipeline();

    // Sicherstellen, dass die Liste leer ist, falls wir sie überschreiben
    pipeline.del(searchQueryKey);

    for (const res of results) {
      const resId = getCoordinatesDataKey(res.latitude, res.longitude);
      const hashKey = `geo:data:${resId}`;

      // A. Füge die ID der Ergebnis-Liste für diesen Suchbegriff hinzu
      pipeline.rpush(searchQueryKey, resId);

      // B. Trage die Koordinaten in den globalen GEO-Index ein (für /reverse Klicks)
      pipeline.geoadd("geo:index", res.longitude, res.latitude, resId);

      // C. Speichere/Aktualisiere die Detaildaten im Hash
      pipeline.hset(hashKey, {
        name: res.name,
        displayName: res.displayName,
        latitude: String(res.latitude),
        longitude: String(res.longitude),
        countryCode: res.countryCode ?? "",
      });

      pipeline.expire(hashKey, CACHE_TTL);
    }

    // TTL für die Suchbegriff-Liste setzen
    pipeline.expire(searchQueryKey, CACHE_TTL);

    // Alle Befehle ausführen
    await pipeline.exec();
  } catch (err) {
    console.error("Redis native write error in search:", err);
  }

  return response.json({ results });
});

geocodeRouter.get("/reverse", async (request, response) => {
  const rawLatitude =
    typeof request.query.lat === "string" ? Number(request.query.lat) : NaN;
  const rawLongitude =
    typeof request.query.lon === "string" ? Number(request.query.lon) : NaN;

  if (Number.isNaN(rawLatitude) || Number.isNaN(rawLongitude)) {
    response.status(400).json({ error: "Latitude and longitude are required" });
    return;
  }

  const latitude = roundCoordinate(rawLatitude);
  const longitude = roundCoordinate(rawLongitude);

  try {
    const nearbyLocations = await redis.geosearch(
      "geo:index",
      "FROMLONLAT",
      longitude,
      latitude,
      "BYRADIUS",
      RADIUS_METERS,
      "m",
      "WITHDIST",
      "ASC", // Den am nächsten gelegenen Ort zuerst
    );

    // Wenn ein Ort im Umkreis von 15m gefunden wurde -> Cache Hit!
    if (nearbyLocations && nearbyLocations.length > 0) {
      const closestMember = (nearbyLocations[0] as unknown[])[0]; // Der Name/ID des Members

      // Hole die strukturierten Daten aus dem zugehörigen Hash
      const hashData = await redis.hgetall(`geo:data:${closestMember}`);

      if (hashData && hashData.name) {
        return response.json({
          name: hashData.name,
          displayName: hashData.displayName,
          latitude: Number(hashData.latitude),
          longitude: Number(hashData.longitude),
          countryCode: hashData.countryCode || undefined,
        });
      }
    }
  } catch (err) {
    console.error("Error accessing Redis cache:", err);
    response.status(500).json({ error: "Internal server error" });
    return;
  }

  const apiIndex = await getNextApiIndex();
  let result: UnifiedGeocodeResult | null = null;

  const providers = [
    // Index 0: Nominatim
    async () => {
      const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
      reverseUrl.searchParams.set("format", "jsonv2");
      reverseUrl.searchParams.set("addressdetails", "1");
      reverseUrl.searchParams.set("lat", String(latitude));
      reverseUrl.searchParams.set("lon", String(longitude));

      console.debug("Nominatim reverse URL:", reverseUrl.toString());
      const res = await fetch(reverseUrl, {
        headers: {
          "user-agent": "WantToGo/1.0 (https://go.schiemann.work)",
          Referer: "https://go.schiemann.work",
        },
      });
      if (!res.ok) throw new Error();
      const entry = (await res.json()) as any;
      const displayName = entry.display_name ?? entry.name ?? "Dropped pin";
      return {
        name: getRegionName(entry.address, displayName),
        displayName,
        latitude,
        longitude,
        countryCode: entry.address?.country_code?.toUpperCase(),
      };
    },
    // Index 1: Photon (Komoot)
    async () => {
      const reverseUrl = new URL("https://photon.komoot.io/reverse");
      reverseUrl.searchParams.set("lat", String(latitude));
      reverseUrl.searchParams.set("lon", String(longitude));

      console.debug("Photon reverse URL:", reverseUrl.toString());
      const res = await fetch(reverseUrl);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { features: any[] };
      if (!data.features.length) throw new Error("No results");

      const props = data.features[0].properties;
      const name = props.name ?? props.city ?? props.country ?? "Dropped pin";
      const displayParts = [
        props.name,
        props.city,
        props.postcode,
        props.country,
      ].filter(Boolean);
      return {
        name,
        displayName: displayParts.join(", ") || name,
        latitude,
        longitude,
        countryCode: props.countrycode?.toUpperCase(),
      };
    },
  ];

  const order = [apiIndex, ...providers.keys()].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  for (const idx of order) {
    try {
      if (providers[idx]) {
        result = await providers[idx]();
        break;
      }
    } catch (err) {
      console.warn(`Reverse Provider Index ${idx} failed, trying next...`);
    }
  }

  if (!result) {
    return response
      .status(502)
      .json({ error: "All reverse geocoding services failed" });
  }

  // 3. Im Cache speichern unter Verwendung nativer Datentypen
  try {
    // Generiere eine ID basierend auf den exakten Koordinaten der API-Antwort
    const locationId = getCoordinatesDataKey(result.latitude, result.longitude);
    const hashKey = `geo:data:${locationId}`;

    // A. Koordinaten in den GEO-Index eintragen
    // Syntax: GEOADD key longitude latitude member
    await redis.geoadd(
      "geo:index",
      result.longitude,
      result.latitude,
      locationId,
    );

    // B. Strukturierte Daten in den Hash schreiben
    await redis.hset(hashKey, {
      name: result.name,
      displayName: result.displayName,
      latitude: String(result.latitude),
      longitude: String(result.longitude),
      countryCode: result.countryCode ?? "",
    });

    // C. TTL setzen (Bei GEO-Indizes setzt man das TTL auf den Daten-Hash.
    // Der GEO-Index wächst zwar, bleibt aber extrem speichereffizient)
    await redis.expire(hashKey, 60 * 60 * 24 * 30); // 30 Tage
  } catch (err) {
    console.error("Redis native write error:", err);
  }

  return response.json(result);
});

export default geocodeRouter;
