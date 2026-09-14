import { createFileRoute } from "@tanstack/react-router";
import { discoverServices } from "@/lib/gis/cadastre.server";
import { allowRequest, clientKey, jsonResponse } from "@/lib/gis/http.server";

export const Route = createFileRoute("/api/public/cadastre/services")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!allowRequest(`ngis:${clientKey(request)}`, 10, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        try {
          const services = await discoverServices();
          return jsonResponse({ available: true, services });
        } catch (error) {
          return jsonResponse(
            {
              available: false,
              services: [],
              error: "Kadastr GIS manbasi hozircha mavjud emas.",
              reason: error instanceof Error ? error.message : "Noma'lum xato",
            },
            502,
          );
        }
      },
    },
  },
});
