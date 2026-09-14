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
  q: z.string().min(2).max(150),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  boundingbox?: string[];
}

export const Route = createFileRoute("/api/public/geocode/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Nominatim siyosatiga rioya: sekundiga 1 so'rovdan oshmaslik.
        if (!allowRequest("nominatim:global", 60, 60_000)) {
          return jsonResponse({ error: "Geokodlash so'rovlari vaqtincha cheklangan." }, 429);
        }
        if (!allowRequest(`geo:${clientKey(request)}`, 15, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        const url = new URL(request.url);
        const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return jsonResponse({ error: "Qidiruv so'rovi noto'g'ri." }, 400);

        const key = `geo:s:${parsed.data.q}:${parsed.data.limit}`;
        const cached = cacheGet<unknown>(key, 24 * 60 * 60_000);
        if (cached) return jsonResponse({ results: cached, cached: true });

        const target = new URL(SOURCES.nominatim.search);
        target.searchParams.set("q", parsed.data.q);
        target.searchParams.set("format", "jsonv2");
        target.searchParams.set("limit", String(parsed.data.limit));
        target.searchParams.set("countrycodes", "uz");
        target.searchParams.set("addressdetails", "1");

        try {
          const hits = await fetchJson<NominatimHit[]>(target.toString(), {
            headers: { "accept-language": "uz" },
          });
          const results = hits.map((hit) => ({
            label: hit.display_name,
            lat: Number(hit.lat),
            lon: Number(hit.lon),
            type: hit.type ?? null,
            boundingbox: hit.boundingbox?.map(Number) ?? null,
          }));
          cacheSet(key, results);
          return jsonResponse({ results, cached: false });
        } catch (error) {
          return jsonResponse(
            {
              results: [],
              error: "Geokodlash xizmati javob bermadi. Koordinatani qo'lda kiriting.",
              reason: error instanceof Error ? error.message : "Noma'lum xato",
            },
            502,
          );
        }
      },
    },
  },
});
