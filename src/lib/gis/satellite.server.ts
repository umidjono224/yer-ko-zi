import * as turf from "@turf/turf";
import { S2_COLLECTION, SOURCES } from "./sources";
import { fetchJson } from "./http.server";

export interface SceneSummary {
  productId: string;
  productName: string;
  collection: string;
  platform: string | null; // sentinel-2a / 2b / 2c
  productType: string | null; // S2MSI2A
  processingLevel: string; // L2A
  datetime: string | null;
  cloudCoverPct: number | null;
  resolutionM: number | null;
  mgrsTile: string | null;
  bbox: [number, number, number, number] | null;
  geometry: GeoJSON.Geometry | null;
  overlapPct: number | null;
  online: boolean | null;
  assets: string[];
  provider: "Copernicus Sentinel-2";
  catalog: "stac" | "odata";
  origin: "real";
}

export interface SceneSearchParams {
  bbox: [number, number, number, number];
  startDate: string; // ISO date
  endDate: string;
  maxCloudCover: number;
  limit: number;
}

interface StacItem {
  id: string;
  bbox?: number[];
  geometry?: GeoJSON.Geometry;
  collection?: string;
  assets?: Record<string, unknown>;
  properties: Record<string, unknown>;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function overlapPercent(
  aoi: [number, number, number, number],
  geometry: GeoJSON.Geometry | null,
): number | null {
  if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) return null;
  try {
    const aoiPoly = turf.bboxPolygon(aoi);
    const scene = turf.feature(geometry) as turf.AllGeoJSON;
    const inter = turf.intersect(
      turf.featureCollection([aoiPoly, scene as never]) as never,
    );
    if (!inter) return 0;
    const aoiArea = turf.area(aoiPoly);
    if (aoiArea <= 0) return null;
    return Math.min(100, (turf.area(inter) / aoiArea) * 100);
  } catch {
    return null;
  }
}

function fromStac(item: StacItem, aoi: [number, number, number, number]): SceneSummary {
  const p = item.properties;
  const geometry = item.geometry ?? null;
  return {
    productId: item.id,
    productName: item.id,
    collection: item.collection ?? S2_COLLECTION,
    platform: str(p["platform"]),
    productType: str(p["product:type"]),
    processingLevel: "L2A",
    datetime: str(p["datetime"]) ?? str(p["start_datetime"]),
    cloudCoverPct: num(p["eo:cloud_cover"]),
    resolutionM: num(p["gsd"]) ?? 10,
    mgrsTile: str(p["grid:code"]),
    bbox: (item.bbox?.length === 4 ? (item.bbox as [number, number, number, number]) : null),
    geometry,
    overlapPct: overlapPercent(aoi, geometry),
    online: null,
    assets: Object.keys(item.assets ?? {}),
    provider: "Copernicus Sentinel-2",
    catalog: "stac",
    origin: "real",
  };
}

/** STAC API — asosiy katalog. */
export async function searchStac(params: SceneSearchParams): Promise<SceneSummary[]> {
  const body = {
    collections: [S2_COLLECTION],
    bbox: params.bbox,
    datetime: `${params.startDate}T00:00:00Z/${params.endDate}T23:59:59Z`,
    limit: Math.min(50, Math.max(params.limit, 5)),
    query: { "eo:cloud_cover": { lte: params.maxCloudCover } },
    sortby: [{ field: "properties.datetime", direction: "desc" }],
  };
  const data = await fetchJson<{ features?: StacItem[] }>(SOURCES.stac.search, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (data.features ?? []).map((item) => fromStac(item, params.bbox));
}

interface ODataProduct {
  Id: string;
  Name: string;
  Online?: boolean;
  S3Path?: string;
  Footprint?: string | null;
  GeoFootprint?: GeoJSON.Geometry | null;
  ContentDate?: { Start?: string; End?: string };
  Attributes?: { Name?: string; Value?: unknown }[];
}

function platformFromName(name: string): string | null {
  const m = /^S2([ABC])_/.exec(name);
  return m ? `sentinel-2${m[1]!.toLowerCase()}` : null;
}

function attrNumber(product: ODataProduct, name: string): number | null {
  const hit = product.Attributes?.find((a) => a.Name === name);
  return typeof hit?.Value === "number" ? hit.Value : null;
}

/** OData katalogi — STAC ishlamasa fallback sifatida. */
export async function searchODataCatalogue(params: SceneSearchParams): Promise<SceneSummary[]> {
  const [minX, minY, maxX, maxY] = params.bbox;
  const ring = `${minX} ${minY},${maxX} ${minY},${maxX} ${maxY},${minX} ${maxY},${minX} ${minY}`;
  const filter = [
    "Collection/Name eq 'SENTINEL-2'",
    "contains(Name,'MSIL2A')",
    `OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((${ring}))')`,
    `ContentDate/Start gt ${params.startDate}T00:00:00.000Z`,
    `ContentDate/Start lt ${params.endDate}T23:59:59.999Z`,
    `Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value le ${params.maxCloudCover})`,
  ].join(" and ");

  const url =
    `${SOURCES.odata.products}?$filter=${encodeURIComponent(filter)}` +
    `&$expand=Attributes&$orderby=${encodeURIComponent("ContentDate/Start desc")}` +
    `&$top=${Math.min(50, Math.max(params.limit, 5))}`;

  const data = await fetchJson<{ value?: ODataProduct[] }>(url);
  return (data.value ?? []).map((product) => {
    const geometry = product.GeoFootprint ?? null;
    return {
      productId: product.Id,
      productName: product.Name,
      collection: "SENTINEL-2",
      platform: platformFromName(product.Name),
      productType: "S2MSI2A",
      processingLevel: "L2A",
      datetime: product.ContentDate?.Start ?? null,
      cloudCoverPct: attrNumber(product, "cloudCover"),
      resolutionM: 10,
      mgrsTile: /_T(\w{5})_/.exec(product.Name)?.[1] ?? null,
      bbox: geometry ? (turf.bbox(geometry as turf.AllGeoJSON) as [number, number, number, number]) : null,
      geometry,
      overlapPct: overlapPercent(params.bbox, geometry),
      online: product.Online ?? null,
      assets: [],
      provider: "Copernicus Sentinel-2",
      catalog: "odata",
      origin: "real",
    } satisfies SceneSummary;
  });
}

/**
 * Saralash mezoni: AOI bilan eng yaxshi qoplanish → eng kam bulutlilik →
 * eng yangi olingan sana.
 */
export function rankScenes(scenes: SceneSummary[]): SceneSummary[] {
  return [...scenes].sort((a, b) => {
    const overlap = (b.overlapPct ?? 0) - (a.overlapPct ?? 0);
    if (Math.abs(overlap) > 5) return overlap;
    const cloud = (a.cloudCoverPct ?? 100) - (b.cloudCoverPct ?? 100);
    if (Math.abs(cloud) > 1) return cloud;
    return (b.datetime ?? "").localeCompare(a.datetime ?? "");
  });
}
