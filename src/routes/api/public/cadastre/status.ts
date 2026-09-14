import { createFileRoute } from "@tanstack/react-router";
import { getStatus } from "@/lib/gis/cadastre.server";
import { jsonResponse } from "@/lib/gis/http.server";

export const Route = createFileRoute("/api/public/cadastre/status")({
  server: {
    handlers: {
      GET: async () => {
        const status = await getStatus();
        return jsonResponse({
          ...status,
          message: status.available
            ? "Kadastr GIS katalogi mavjud."
            : "Kadastr GIS manbasi hozircha mavjud emas.",
        });
      },
    },
  },
});
