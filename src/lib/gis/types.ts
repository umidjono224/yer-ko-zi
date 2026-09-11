import type { Feature, Polygon } from "geojson";

export type DataOrigin = "real" | "demo";

export interface ParcelProperties {
  cadastralId: string;
  areaSqm: number;
  registeredBuildingSqm: number;
  region: string;
  district: string;
  mahalla: string;
  origin: DataOrigin;
}

export type ParcelFeature = Feature<Polygon, ParcelProperties>;

export type DetectionStatus = "matched" | "not_found" | "geometry_diff";

export interface DetectionProperties {
  detectionId: string;
  cadastralId: string;
  areaSqm: number;
  perimeterM: number;
  confidence: number | null;
  status: DetectionStatus;
  isNew: boolean;
  origin: DataOrigin;
  modelName: string;
  modelVersion: string;
}

export type DetectionFeature = Feature<Polygon, DetectionProperties>;

export interface ImageryMetadata {
  imageId: string;
  provider: string;
  acquisitionDate: string; // ISO
  resolutionM: number;
  cloudCoverPct: number;
  origin: DataOrigin;
  bbox: [number, number, number, number];
}

export interface ImageryProvider {
  name: string;
  kind: "high_resolution" | "aerial" | "sentinel2";
  searchLatest(aoi: Feature<Polygon>): Promise<ImageryMetadata | null>;
  getMetadata(imageId: string): Promise<ImageryMetadata | null>;
}

export interface CadastralProvider {
  name: string;
  origin: DataOrigin;
  getParcels(aoi: Feature<Polygon>): Promise<ParcelFeature[]>;
}

export interface AoiSelection {
  label: string;
  region?: string;
  district?: string;
  mahalla?: string;
  feature: Feature<Polygon>;
}

export interface AnalysisResult {
  aoi: AoiSelection;
  parcels: ParcelFeature[];
  detections: DetectionFeature[];
  imagery: ImageryMetadata;
  startedAt: string;
  finishedAt: string;
  origin: DataOrigin;
}
