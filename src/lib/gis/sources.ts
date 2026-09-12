/**
 * Barcha tashqi manba manzillari shu yerda. Faqat bepul/ochiq manbalar.
 * Hech qanday maxfiy kalit yoki token bu faylda saqlanmaydi.
 */

export const SOURCES = {
  stac: {
    root: "https://stac.dataspace.copernicus.eu/v1",
    collections: "https://stac.dataspace.copernicus.eu/v1/collections",
    collection: "https://stac.dataspace.copernicus.eu/v1/collections/sentinel-2-l2a",
    queryables: "https://stac.dataspace.copernicus.eu/v1/collections/sentinel-2-l2a/queryables",
    search: "https://stac.dataspace.copernicus.eu/v1/search",
  },
  odata: {
    products: "https://catalogue.dataspace.copernicus.eu/odata/v1/Products",
  },
  ngis: {
    catalog: "https://db.ngis.uz/db/rest/services?f=pjson",
    base: "https://db.ngis.uz/db/rest/services",
    portal: "https://open.ngis.uz",
  },
  openData: {
    portal: "https://data.egov.uz",
  },
  osm: {
    // Frontend config orqali oson almashtiriladi.
    tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  nominatim: {
    search: "https://nominatim.openstreetmap.org/search",
    reverse: "https://nominatim.openstreetmap.org/reverse",
  },
} as const;

export const S2_COLLECTION = "sentinel-2-l2a";

/** Sentinel-2 L2A haqiqiy band nomlari (STAC asset kalitlari bilan mos). */
export const S2_BANDS = {
  B02: { asset: "B02_10m", label: "Ko'k (Blue)", gsd: 10 },
  B03: { asset: "B03_10m", label: "Yashil (Green)", gsd: 10 },
  B04: { asset: "B04_10m", label: "Qizil (Red)", gsd: 10 },
  B08: { asset: "B08_10m", label: "Yaqin infraqizil (NIR)", gsd: 10 },
  TCI: { asset: "TCI_10m", label: "Haqiqiy rang kompozit", gsd: 10 },
  SCL: { asset: "SCL_20m", label: "Sahna klassifikatsiyasi (bulut niqobi)", gsd: 20 },
  CLD: { asset: "CLD_20m", label: "Bulut ehtimoli", gsd: 20 },
} as const;

export type RenderMode = "true_color" | "false_color" | "vegetation" | "built_up" | "change";

export const RENDER_MODES: { key: RenderMode; label: string; recipe: string }[] = [
  { key: "true_color", label: "Haqiqiy rang", recipe: "R=B04, G=B03, B=B02" },
  { key: "false_color", label: "Soxta rang", recipe: "R=B08, G=B04, B=B03" },
  { key: "vegetation", label: "Vegetatsiya", recipe: "NDVI = (B08 − B04) / (B08 + B04)" },
  { key: "built_up", label: "Qurilgan hudud", recipe: "NDBI ko'rsatkichi (B11, B08)" },
  { key: "change", label: "O'zgarishlar", recipe: "Ikki sana orasidagi farq niqobi" },
];

export const PIPELINE_STEPS = [
  "Sentinel-2 L2A mahsuloti",
  "Bulut niqobi (SCL / CLD)",
  "AOI bo'yicha kesish",
  "Band tanlash",
  "RGB / soxta rang kompozit",
  "Tasvir yaxshilash",
  "Ixtiyoriy super-resolution",
  "Bino / o'zgarish tahlili",
] as const;

export const SENTINEL2_RESOLUTION_NOTE =
  "Sentinel-2 tasvirining haqiqiy fazoviy aniqligi 10 m. Har qanday qayta ishlash natijasi «AI yordamida qayta ishlangan tasvir» hisoblanadi va haqiqiy aniqlikni oshirmaydi.";
