import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import { buildDemoDetections } from "./demo-data";
import { cadastralProvider, delay, DemoHighResolutionProvider } from "./providers";
import type { AnalysisResult, AoiSelection, DetectionFeature, ParcelFeature } from "./types";

export const ANALYSIS_STEPS = [
  "Kadastr ma'lumotlari olinmoqda...",
  "Eng so'nggi tasvir qidirilmoqda...",
  "Tasvir qayta ishlanmoqda...",
  "Qurilish obyektlari aniqlanmoqda...",
  "Natijalar tayyorlanmoqda...",
] as const;

/**
 * Bino aniqlash abstraksiyasi. Keyinchalik backend (segmentation / object
 * detection modeli) ulanganda faqat shu funksiya almashtiriladi.
 */
async function detectBuildings(parcels: ParcelFeature[]): Promise<DetectionFeature[]> {
  await delay(900);
  return buildDemoDetections(parcels);
}

export async function runAnalysis(
  aoi: AoiSelection,
  onStep: (stepIndex: number) => void,
): Promise<AnalysisResult> {
  const startedAt = new Date().toISOString();

  onStep(0);
  const parcels = await cadastralProvider.getParcels(aoi.feature, {
    region: aoi.region ?? "—",
    district: aoi.district ?? "—",
    mahalla: aoi.mahalla ?? aoi.label,
  });

  onStep(1);
  const imageryProvider = new DemoHighResolutionProvider();
  const imagery = await imageryProvider.searchLatest(aoi.feature);
  if (!imagery) {
    throw new Error(
      "Ushbu hudud uchun hozircha talabga javob beradigan yuqori aniqlikdagi tasvir topilmadi.",
    );
  }

  onStep(2);
  await delay(500);

  onStep(3);
  const detections = await detectBuildings(parcels);

  onStep(4);
  await delay(400);

  return {
    aoi,
    parcels,
    detections,
    imagery,
    startedAt,
    finishedAt: new Date().toISOString(),
    origin: "demo",
  };
}

export function areaSqm(feature: Feature<Polygon>) {
  return turf.area(feature);
}

export function perimeterM(feature: Feature<Polygon>) {
  return turf.length(turf.polygonToLine(feature), { units: "meters" });
}

export function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("uz-UZ", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function confidenceLabel(confidence: number | null) {
  if (confidence === null) return "Aniqlanmagan";
  if (confidence >= 0.85) return "Yuqori";
  if (confidence >= 0.65) return "O'rta";
  return "Past";
}

export function statusLabel(status: DetectionFeature["properties"]["status"]) {
  switch (status) {
    case "matched":
      return "Rasmiy ma'lumot bilan mos keladi";
    case "geometry_diff":
      return "Geometrik farq aniqlandi";
    default:
      return "Rasmiy ma'lumot bilan mos obyekt topilmadi";
  }
}

export const LEGAL_NOTICE =
  "Ushbu natijalar masofadan zondlash, geospatial ma'lumotlar va avtomatlashtirilgan tahlil asosida shakllantirilgan. Natija huquqiy xulosa hisoblanmaydi. Yer uchastkasi yoki qurilishning huquqiy holati vakolatli organ tomonidan rasmiy ma'lumotlar asosida tekshirilishi lozim.";
