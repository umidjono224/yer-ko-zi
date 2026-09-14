import { createFileRoute } from "@tanstack/react-router";
import { describeService, discoverServices } from "@/lib/gis/cadastre.server";
import { allowRequest, cacheGet, cacheSet, clientKey, jsonResponse } from "@/lib/gis/http.server";

export const Route = createFileRoute("/api/public/cadastre/layers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!allowRequest(`ngislayers:${clientKey(request)}`, 10, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        const cached = cacheGet<unknown>("ngis:layers", 10 * 60_000);
        if (cached) return jsonResponse({ ...(cached as object), cached: true });

        try {
          const services = await discoverServices();
          // Servis metadata'si o'qiladi — layer ID hech qachon taxmin qilinmaydi.
          const described = await Promise.all(services.slice(0, 12).map(describeService));
          const relevantLayers = described.flatMap((service) =>
            service.layers
              .filter((layer) => layer.relevant)
              .map((layer) => ({ service: service.name, ...layer })),
          );
          const payload = { available: true, services: described, relevantLayers };
          cacheSet("ngis:layers", payload);
          return jsonResponse({ ...payload, cached: false });
        } catch (error) {
          return jsonResponse(
            {
              available: false,
              services: [],
              relevantLayers: [],
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
