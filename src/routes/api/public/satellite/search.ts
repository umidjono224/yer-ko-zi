import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { allowRequest, cacheGet, cacheSet, clientKey, jsonResponse } from "@/lib/gis/http.server";
import { rankScenes, searchODataCatalogue, searchStac } from "@/lib/gis/satellite.server";

const schema = z.object({
  bbox: z
    .string()
    .transform((v) => v.split(",").map(Number))
    .refine((v) => v.length === 4 && v.every(Number.isFinite), "bbox noto'g'ri")
    .transform((v) => v as [number, number, number, number]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  max_cloud_cover: z.coerce.number().min(0).max(100).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const Route = createFileRoute("/api/public/satellite/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!allowRequest(`sat:${clientKey(request)}`, 30, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi. Biroz kuting." }, 429);
        }
        const url = new URL(request.url);
        const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
          return jsonResponse(
            { error: "So'rov parametrlari noto'g'ri", details: parsed.error.issues },
            400,
          );
        }
        const params = {
          bbox: parsed.data.bbox,
          startDate: parsed.data.start_date,
          endDate: parsed.data.end_date,
          maxCloudCover: parsed.data.max_cloud_cover,
          limit: parsed.data.limit,
        };

        const cacheKey = `sat:${JSON.stringify(params)}`;
        const cached = cacheGet<unknown>(cacheKey, 10 * 60_000);
        if (cached) return jsonResponse({ ...(cached as object), cached: true });

        const errors: { catalog: string; message: string }[] = [];

        // 1-bosqich: STAC API
        try {
          const scenes = rankScenes(await searchStac(params));
          const payload = { source: "stac" as const, degraded: false, scenes, errors };
          cacheSet(cacheKey, payload);
          return jsonResponse({ ...payload, cached: false });
        } catch (error) {
          errors.push({
            catalog: "stac",
            message: error instanceof Error ? error.message : "STAC API javob bermadi",
          });
        }

        // 2-bosqich: OData fallback
        try {
          const scenes = rankScenes(await searchODataCatalogue(params));
          const payload = { source: "odata" as const, degraded: true, scenes, errors };
          cacheSet(cacheKey, payload);
          return jsonResponse({ ...payload, cached: false });
        } catch (error) {
          errors.push({
            catalog: "odata",
            message: error instanceof Error ? error.message : "OData katalogi javob bermadi",
          });
        }

        // 3-bosqich: hech qanday real natija yo'q — soxta ma'lumot qaytarilmaydi.
        return jsonResponse(
          {
            source: "none",
            degraded: true,
            scenes: [],
            errors,
            error:
              "Sun'iy yo'ldosh kataloglari hozircha javob bermayapti. Real tasvir ma'lumoti olinmadi.",
          },
          502,
        );
      },
    },
  },
});
