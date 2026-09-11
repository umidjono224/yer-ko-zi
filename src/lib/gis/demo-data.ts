import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import type { DetectionFeature, ParcelFeature } from "./types";

export interface AdminUnit {
  name: string;
  center: [number, number];
  children?: AdminUnit[];
}

// Ma'muriy birliklar ro'yxati (namunaviy markaziy koordinatalar bilan).
export const ADMIN_TREE: AdminUnit[] = [
  {
    name: "Samarqand viloyati",
    center: [66.9597, 39.6542],
    children: [
      {
        name: "Pastdarg'om tumani",
        center: [66.7386, 39.5223],
        children: [
          { name: "Mirbozor mahallasi", center: [66.7386, 39.5223] },
          { name: "Chordara mahallasi", center: [66.7605, 39.5388] },
          { name: "Yangiobod mahallasi", center: [66.7182, 39.5061] },
        ],
      },
      {
        name: "Samarqand shahri",
        center: [66.9597, 39.6542],
        children: [
          { name: "Registon mahallasi", center: [66.9749, 39.6547] },
          { name: "Bog'ishamol mahallasi", center: [66.9382, 39.6721] },
        ],
      },
    ],
  },
  {
    name: "Toshkent viloyati",
    center: [69.2401, 41.2995],
    children: [
      {
        name: "Zangiota tumani",
        center: [69.1417, 41.185],
        children: [
          { name: "Nazarbek mahallasi", center: [69.1417, 41.185] },
          { name: "Eshonguzar mahallasi", center: [69.1685, 41.1622] },
        ],
      },
    ],
  },
  {
    name: "Buxoro viloyati",
    center: [64.4207, 39.7681],
    children: [
      {
        name: "Kogon tumani",
        center: [64.5535, 39.7228],
        children: [{ name: "Yangibog' mahallasi", center: [64.5535, 39.7228] }],
      },
    ],
  },
];

export function squareAround(center: [number, number], sideKm: number): Feature<Polygon> {
  const half = sideKm / 2;
  const pt = turf.point(center);
  const west = turf.destination(pt, half, -90, { units: "kilometers" }).geometry.coordinates[0] as number;
  const east = turf.destination(pt, half, 90, { units: "kilometers" }).geometry.coordinates[0] as number;
  const south = turf.destination(pt, half, 180, { units: "kilometers" }).geometry.coordinates[1] as number;
  const north = turf.destination(pt, half, 0, { units: "kilometers" }).geometry.coordinates[1] as number;
  return turf.polygon([
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ],
  ]);
}

// Deterministik psevdo-tasodifiy generator (demo ma'lumot uchun).
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(text: string) {
  let h = 7;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 2147483647;
  return h;
}

export interface DemoAreaOptions {
  aoi: Feature<Polygon>;
  region: string;
  district: string;
  mahalla: string;
}

export function buildDemoParcels({ aoi, region, district, mahalla }: DemoAreaOptions): ParcelFeature[] {
  const rand = rng(hash(`${region}|${district}|${mahalla}`));
  const [minX, minY, maxX, maxY] = turf.bbox(aoi) as [number, number, number, number];
  const cols = 12;
  const rows = 9;
  const dx = (maxX - minX) / cols;
  const dy = (maxY - minY) / rows;
  const parcels: ParcelFeature[] = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (rand() < 0.12) continue; // yo'l va bo'sh joylar
      const padX = dx * (0.07 + rand() * 0.05);
      const padY = dy * (0.07 + rand() * 0.05);
      const x0 = minX + c * dx + padX;
      const y0 = minY + r * dy + padY;
      const x1 = minX + (c + 1) * dx - padX;
      const y1 = minY + (r + 1) * dy - padY;
      const ring: [number, number][] = [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ];
      const geom = turf.polygon([ring]);
      const areaSqm = Math.round(turf.area(geom));
      parcels.push({
        type: "Feature",
        geometry: geom.geometry,
        properties: {
          cadastralId: `${10 + (hash(mahalla) % 8)}:${String(r + 1).padStart(2, "0")}:${String(
            c + 1,
          ).padStart(2, "0")}:${String(1000 + Math.floor(rand() * 8999))}`,
          areaSqm,
          registeredBuildingSqm: Math.round(areaSqm * (0.12 + rand() * 0.22)),
          region,
          district,
          mahalla,
          origin: "demo",
        },
      });
    }
  }
  return parcels;
}

export function buildDemoDetections(parcels: ParcelFeature[]): DetectionFeature[] {
  const rand = rng(hash(parcels.map((p) => p.properties.cadastralId).join("")));
  const detections: DetectionFeature[] = [];

  parcels.forEach((parcel, index) => {
    if (rand() > 0.34) return;
    const [minX, minY, maxX, maxY] = turf.bbox(parcel) as [number, number, number, number];
    const w = (maxX - minX) * (0.3 + rand() * 0.3);
    const h = (maxY - minY) * (0.3 + rand() * 0.3);
    const ox = minX + (maxX - minX - w) * rand();
    const oy = minY + (maxY - minY - h) * rand();
    const geom = turf.polygon([
      [
        [ox, oy],
        [ox + w, oy],
        [ox + w, oy + h],
        [ox, oy + h],
        [ox, oy],
      ],
    ]);
    const areaSqm = Math.round(turf.area(geom) * 10) / 10;
    const perimeterM = Math.round(turf.length(turf.polygonToLine(geom), { units: "meters" }) * 10) / 10;
    const roll = rand();
    const status = roll < 0.42 ? "not_found" : roll < 0.7 ? "geometry_diff" : "matched";
    detections.push({
      type: "Feature",
      geometry: geom.geometry,
      properties: {
        detectionId: `OBJ-${String(index + 1).padStart(4, "0")}`,
        cadastralId: parcel.properties.cadastralId,
        areaSqm,
        perimeterM,
        confidence: Math.round((0.55 + rand() * 0.44) * 100) / 100,
        status,
        isNew: status !== "matched",
        origin: "demo",
        modelName: "demo-segmentation",
        modelVersion: "0.1.0-demo",
      },
    });
  });

  return detections;
}
