import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import { buildDemoParcels } from "./demo-data";
import type { CadastralProvider, ImageryMetadata, ImageryProvider, ParcelFeature } from "./types";

/**
 * Kadastr manbasi abstraksiyasi.
 * Rasmiy manba (open.ngis.uz ArcGIS/WFS/WMS servislari) ulanganda
 * shu interfeys asosida yangi provider qo'shiladi — qolgan kod o'zgarmaydi.
 */
export class DemoCadastralProvider implements CadastralProvider {
  name = "Namunaviy kadastr manbasi";
  origin = "demo" as const;

  async getParcels(
    aoi: Feature<Polygon>,
    meta?: { region: string; district: string; mahalla: string },
  ): Promise<ParcelFeature[]> {
    await delay(600);
    return buildDemoParcels({
      aoi,
      region: meta?.region ?? "—",
      district: meta?.district ?? "—",
      mahalla: meta?.mahalla ?? "—",
    });
  }
}

/**
 * Tasvir manbasi abstraksiyasi.
 * Litsenziyalangan yuqori aniqlikdagi provider ulanganda searchLatest()
 * backend orqali chaqiriladi; API kalitlar hech qachon frontendda saqlanmaydi.
 */
export class DemoHighResolutionProvider implements ImageryProvider {
  name = "Namunaviy yuqori aniqlikdagi manba";
  kind = "high_resolution" as const;

  async searchLatest(aoi: Feature<Polygon>): Promise<ImageryMetadata | null> {
    await delay(700);
    const bbox = turf.bbox(aoi) as [number, number, number, number];
    const now = new Date();
    now.setDate(now.getDate() - 3);
    return {
      imageId: `DEMO-HR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
        now.getDate(),
      ).padStart(2, "0")}-001`,
      provider: this.name,
      acquisitionDate: now.toISOString(),
      resolutionM: 0.5,
      cloudCoverPct: 3,
      origin: "demo",
      bbox,
    };
  }

  async getMetadata(): Promise<ImageryMetadata | null> {
    return null;
  }
}

export class Sentinel2Provider implements ImageryProvider {
  name = "Sentinel-2 (qo'shimcha tahlil)";
  kind = "sentinel2" as const;
  async searchLatest(): Promise<ImageryMetadata | null> {
    return null;
  }
  async getMetadata(): Promise<ImageryMetadata | null> {
    return null;
  }
}

export const IMAGERY_PROVIDERS: ImageryProvider[] = [
  new DemoHighResolutionProvider(),
  new Sentinel2Provider(),
];

export const cadastralProvider = new DemoCadastralProvider();

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
