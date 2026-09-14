import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SOURCES } from "@/lib/gis/sources";
import {
  allowRequest,
  cacheGet,
  cacheSet,
  clientKey,
  fetchJson,
  jsonResponse,
} from "@/lib/gis/http.server";

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const Route = createFileRoute("/api/public/geocode/reverse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!allowRequest("nominatim:global", 60, 60_000)) {
          return jsonResponse({ error: "Geokodlash so'rovlari vaqtincha cheklangan." }, 429);
        }
        if (!allowRequest(`georev:${clientKey(request)}`, 15, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        const url = new URL(request.url);
        const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return jsonResponse({ error: "Koordinata noto'g'ri." }, 400);

        const key = `geo:r:${parsed.data.lat.toFixed(5)}:${parsed.data.lon.toFixed(5)}`;
        const cached = cacheGet<unknown>(key, 24 * 60 * 60_000);
        if (cached) return jsonResponse({ result: cached, cached: true });

        const target = new URL(SOURCES.nominatim.reverse);
        target.searchParams.set("lat", String(parsed.data.lat));
        target.searchParams.set("lon", String(parsed.data.lon));
        target.searchParams.set("format", "jsonv2");

        try {
          const hit = await fetchJson<{ display_name?: string; address?: Record<string, string> }>(
            target.toString(),
            { headers: { "accept-language": "uz" } },
          );
          const result = { label: hit.display_name ?? null, address: hit.address ?? null };
          cacheSet(key, result);
          return jsonResponse({ result, cached: false });
        } catch (error) {
          return jsonResponse(
            {
              result: null,
              error: "Manzilni aniqlash xizmati javob bermadi.",
              reason: error instanceof Error ? error.message : "Noma'lum xato",
            },
            502,
          );
        }
      },
    },
  },
});
