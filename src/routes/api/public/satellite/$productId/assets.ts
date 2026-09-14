import { createFileRoute } from "@tanstack/react-router";
import { SOURCES } from "@/lib/gis/sources";
import { allowRequest, clientKey, fetchJson, jsonResponse } from "@/lib/gis/http.server";

interface StacAsset {
  href?: string;
  type?: string;
  title?: string;
  roles?: string[];
  "auth:refs"?: string[];
}

export const Route = createFileRoute("/api/public/satellite/$productId/assets")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!allowRequest(`satassets:${clientKey(request)}`, 60, 60_000)) {
          return jsonResponse({ error: "So'rovlar soni chegaradan oshdi." }, 429);
        }
        const id = params.productId;
        if (!/^[A-Za-z0-9_.:-]{5,120}$/.test(id)) {
          return jsonResponse({ error: "Mahsulot identifikatori noto'g'ri." }, 400);
        }
        try {
          const item = await fetchJson<{ assets?: Record<string, StacAsset> }>(
            `${SOURCES.stac.collection}/items/${encodeURIComponent(id)}`,
          );
          const assets = Object.entries(item.assets ?? {}).map(([key, asset]) => ({
            key,
            title: asset.title ?? key,
            type: asset.type ?? null,
            roles: asset.roles ?? [],
            // href oshkor qilinadi, lekin yuklab olish uchun Copernicus
            // autentifikatsiyasi kerak — u faqat backend orqali amalga oshiriladi.
            href: asset.href ?? null,
            authRequired: (asset["auth:refs"] ?? []).length > 0,
          }));
          return jsonResponse({
            productId: id,
            assets,
            note: "Asset fayllarini yuklab olish uchun Copernicus hisobi (OIDC/S3) talab qilinadi. Credential faqat serverda saqlanadi.",
          });
        } catch (error) {
          return jsonResponse(
            {
              error: "Asset ro'yxati olinmadi.",
              reason: error instanceof Error ? error.message : "Noma'lum xato",
            },
            502,
          );
        }
      },
    },
  },
});
