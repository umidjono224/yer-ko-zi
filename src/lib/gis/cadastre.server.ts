import { SOURCES } from "./sources";
import { cacheGet, cacheSet, fetchJson } from "./http.server";

/**
 * NGIS (O'zbekiston kadastr GIS) ArcGIS REST katalogini avtomatik aniqlash.
 * Hech qanday service nomi, layer ID yoki token taxmin qilinmaydi —
 * hammasi katalog metadata'sidan o'qiladi.
 */

export interface DiscoveredLayer {
  id: number;
  name: string;
  type: string;
  geometryType: string | null;
  relevant: boolean;
  queryUrl: string;
}

export interface DiscoveredService {
  name: string;
  type: "MapServer" | "FeatureServer";
  url: string;
  reachable: boolean;
  error: string | null;
  layers: DiscoveredLayer[];
}

export interface CadastreStatus {
  available: boolean;
  catalogUrl: string;
  httpStatus: number | null;
  checkedAt: string;
  error: string | null;
  folders: string[];
  serviceCount: number;
}

const RELEVANT = [
  "parcel",
  "cadas",
  "kadastr",
  "land",
  "yer",
  "uchastka",
  "building",
  "bino",
  "boundary",
  "chegara",
  "zone",
];

function isRelevant(name: string): boolean {
  const lower = name.toLowerCase();
  return RELEVANT.some((token) => lower.includes(token));
}

interface CatalogResponse {
  folders?: string[];
  services?: { name: string; type: string }[];
  error?: { message?: string };
}

export async function fetchCatalog(): Promise<CatalogResponse> {
  const cached = cacheGet<CatalogResponse>("ngis:catalog", 5 * 60_000);
  if (cached) return cached;
  const data = await fetchJson<CatalogResponse>(SOURCES.ngis.catalog, undefined, 15_000);
  if (data.error) throw new Error(data.error.message ?? "NGIS katalogi xato qaytardi");
  cacheSet("ngis:catalog", data);
  return data;
}

export async function getStatus(): Promise<CadastreStatus> {
  const base: CadastreStatus = {
    available: false,
    catalogUrl: SOURCES.ngis.catalog,
    httpStatus: null,
    checkedAt: new Date().toISOString(),
    error: null,
    folders: [],
    serviceCount: 0,
  };
  try {
    const catalog = await fetchCatalog();
    return {
      ...base,
      available: true,
      httpStatus: 200,
      folders: catalog.folders ?? [],
      serviceCount: (catalog.services ?? []).length,
    };
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : "NGIS katalogiga ulanib bo'lmadi",
    };
  }
}

/** Katalogdagi (va papkalardagi) MapServer/FeatureServer servislarini aniqlash. */
export async function discoverServices(maxFolders = 6): Promise<DiscoveredService[]> {
  const catalog = await fetchCatalog();
  const entries: { name: string; type: string }[] = [...(catalog.services ?? [])];

  for (const folder of (catalog.folders ?? []).slice(0, maxFolders)) {
    try {
      const sub = await fetchJson<CatalogResponse>(
        `${SOURCES.ngis.base}/${encodeURIComponent(folder)}?f=pjson`,
        undefined,
        15_000,
      );
      entries.push(...(sub.services ?? []));
    } catch {
      // Papka o'qilmasa, qolganini davom ettiramiz.
    }
  }

  const supported = entries.filter((s) => s.type === "MapServer" || s.type === "FeatureServer");
  return supported.map((service) => ({
    name: service.name,
    type: service.type as "MapServer" | "FeatureServer",
    url: `${SOURCES.ngis.base}/${service.name}/${service.type}`,
    reachable: false,
    error: null,
    layers: [],
  }));
}

/** Bitta servisning metadata'sidan HAQIQIY layer ID va nomlarini o'qish. */
export async function describeService(service: DiscoveredService): Promise<DiscoveredService> {
  try {
    const meta = await fetchJson<{
      layers?: { id: number; name: string; geometryType?: string }[];
      tables?: { id: number; name: string }[];
    }>(`${service.url}?f=pjson`, undefined, 15_000);

    const layers: DiscoveredLayer[] = (meta.layers ?? []).map((layer) => ({
      id: layer.id,
      name: layer.name,
      type: service.type,
      geometryType: layer.geometryType ?? null,
      relevant: isRelevant(layer.name),
      queryUrl: `${service.url}/${layer.id}/query`,
    }));
    return { ...service, reachable: true, error: null, layers };
  } catch (error) {
    return {
      ...service,
      reachable: false,
      error: error instanceof Error ? error.message : "Servis metadata'si o'qilmadi",
      layers: [],
    };
  }
}

/** Faqat metadata'dan aniqlangan haqiqiy query URL bo'yicha so'rov yuboriladi. */
export async function queryLayer(input: {
  queryUrl: string;
  bbox: [number, number, number, number];
  maxRecords: number;
}) {
  const url = new URL(input.queryUrl);
  if (url.hostname !== new URL(SOURCES.ngis.base).hostname) {
    throw new Error("Faqat NGIS manbasiga so'rov yuborish mumkin");
  }
  const [minX, minY, maxX, maxY] = input.bbox;
  url.searchParams.set("f", "geojson");
  url.searchParams.set("geometry", `${minX},${minY},${maxX},${maxY}`);
  url.searchParams.set("geometryType", "esriGeometryEnvelope");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("resultRecordCount", String(input.maxRecords));
  return fetchJson<GeoJSON.FeatureCollection>(url.toString(), undefined, 25_000);
}
