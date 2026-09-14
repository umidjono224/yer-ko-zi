import { createFileRoute } from "@tanstack/react-router";
import { SOURCES } from "@/lib/gis/sources";
import { allowRequest, clientKey, fetchJson, jsonResponse } from "@/lib/gis/http.server";

export const Route = createFileRoute("/api/public/satellite/$productId/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!allowRequest(`satitem:${clientKey(request)}`, 60, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        const id = params.productId;
        if (!/^[A-Za-z0-9_.:-]{5,120}$/.test(id)) {
          return jsonResponse({ error: "Mahsulot identifikatori noto'g'ri." }, 400);
        }
        try {
          const item = await fetchJson<Record<string, unknown>>(
            `${SOURCES.stac.collection}/items/${encodeURIComponent(id)}`,
          );
          return jsonResponse({ source: "stac", item });
        } catch (error) {
          return jsonResponse(
            {
              error: "Mahsulot metadata'si olinmadi.",
              reason: error instanceof Error ? error.message : "Noma'lum xato",
            },
            502,
          );
        }
      },
    },
  },
});
