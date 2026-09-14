import { createFileRoute } from "@tanstack/react-router";
import { SOURCES } from "@/lib/gis/sources";
import { allowRequest, clientKey, jsonResponse, probe } from "@/lib/gis/http.server";

export interface DiagnosticEntry {
  key: string;
  label: string;
  url: string;
  status: "ok" | "warn" | "down";
  httpStatus: number | null;
  durationMs: number;
  checkedAt: string;
  error: string | null;
  authRequired: boolean;
  demoFallback: boolean;
  note: string;
}

export const Route = createFileRoute("/api/public/diagnostics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!allowRequest(`diag:${clientKey(request)}`, 10, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        const checkedAt = new Date().toISOString();

        const searchBody = JSON.stringify({
          collections: ["sentinel-2-l2a"],
          bbox: [66.8, 39.5, 67.1, 39.8],
          limit: 1,
        });

        const [stacRoot, s2Collection, stacSearch, odata, ngis, osmTile, nominatim, egov] =
          await Promise.all([
            probe(SOURCES.stac.root),
            probe(SOURCES.stac.collection),
            probe(SOURCES.stac.search, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: searchBody,
            }),
            probe(
              `${SOURCES.odata.products}?$filter=${encodeURIComponent("Collection/Name eq 'SENTINEL-2'")}&$top=1`,
            ),
            probe(SOURCES.ngis.catalog),
            probe(SOURCES.osm.tiles.replace("{z}", "11").replace("{x}", "1357").replace("{y}", "810")),
            probe(`${SOURCES.nominatim.search}?q=Samarqand&format=jsonv2&limit=1`),
            probe(SOURCES.openData.portal),
          ]);

        const entry = (
          key: string,
          label: string,
          result: Awaited<ReturnType<typeof probe>>,
          options: { authRequired?: boolean; demoFallback?: boolean; note: string },
        ): DiagnosticEntry => ({
          key,
          label,
          url: result.url,
          status: result.ok ? "ok" : result.httpStatus ? "warn" : "down",
          httpStatus: result.httpStatus,
          durationMs: result.durationMs,
          checkedAt,
          error: result.error,
          authRequired: options.authRequired ?? false,
          demoFallback: options.demoFallback ?? false,
          note: options.note,
        });

        const checks: DiagnosticEntry[] = [
          entry("stac_root", "Copernicus STAC API (asosiy)", stacRoot, {
            note: "Katalog ildizi. Qidiruv shu API orqali amalga oshiriladi.",
          }),
          entry("stac_s2l2a", "Sentinel-2 L2A to'plami", s2Collection, {
            note: "sentinel-2-l2a to'plami mavjudligi tekshiriladi.",
          }),
          entry("stac_search", "STAC qidiruv (POST /search)", stacSearch, {
            demoFallback: true,
            note: "AOI bo'yicha tasvir qidirish endpointi.",
          }),
          entry("odata", "Copernicus OData katalogi", odata, {
            demoFallback: true,
            note: "STAC ishlamasa avtomatik fallback sifatida ishlatiladi.",
          }),
          entry("ngis", "NGIS kadastr REST katalogi", ngis, {
            demoFallback: true,
            note: "Servis va layer ro'yxati faqat shu metadata'dan o'qiladi.",
          }),
          entry("osm", "OpenStreetMap tile serveri", osmTile, {
            note: "Asosiy xarita qatlami. © OpenStreetMap contributors.",
          }),
          entry("nominatim", "Nominatim geokodlash", nominatim, {
            note: "Manzil qidiruvi backend proksi orqali, cache va limit bilan.",
          }),
          entry("egov", "data.egov.uz ochiq ma'lumotlar", egov, {
            note: "Dataset metadata'si orqali qidiriladi; geometriyasiz dataset GIS manbasi sifatida ishlatilmaydi.",
          }),
          {
            key: "postgis",
            label: "PostGIS ma'lumotlar bazasi",
            url: "—",
            status: "down",
            httpStatus: null,
            durationMs: 0,
            checkedAt,
            error: "Ma'lumotlar bazasi hali ulanmagan.",
            authRequired: true,
            demoFallback: true,
            note: "Geometriyalarni saqlash uchun PostgreSQL + PostGIS ulanishi kerak.",
          },
          {
            key: "copernicus_download",
            label: "Copernicus mahsulot yuklab olish (S3/OIDC)",
            url: "https://identity.dataspace.copernicus.eu",
            status: "warn",
            httpStatus: null,
            durationMs: 0,
            checkedAt,
            error: "Autentifikatsiya ma'lumotlari kiritilmagan.",
            authRequired: true,
            demoFallback: false,
            note: "Metadata ochiq, lekin piksel ma'lumotini yuklash uchun hisob kerak. Credential faqat serverda saqlanadi.",
          },
        ];

        return jsonResponse({ checkedAt, checks });
      },
    },
  },
});
