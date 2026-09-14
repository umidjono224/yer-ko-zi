import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { queryLayer } from "@/lib/gis/cadastre.server";
import { allowRequest, clientKey, jsonResponse } from "@/lib/gis/http.server";

const schema = z.object({
  queryUrl: z.string().url().max(500),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  maxRecords: z.number().int().min(1).max(2000).default(500),
});

export const Route = createFileRoute("/api/public/cadastre/query")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!allowRequest(`ngisq:${clientKey(request)}`, 20, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return jsonResponse({ error: "So'rov parametrlari noto'g'ri." }, 400);
        }
        try {
          const featureCollection = await queryLayer(parsed.data);
          return jsonResponse({
            origin: "real",
            count: featureCollection.features?.length ?? 0,
            featureCollection,
          });
        } catch (error) {
          return jsonResponse(
            {
              origin: "none",
              error: "Kadastr qatlamidan ma'lumot olinmadi.",
              reason: error instanceof Error ? error.message : "Noma'lum xato",
            },
            502,
          );
        }
      },
    },
  },
});
