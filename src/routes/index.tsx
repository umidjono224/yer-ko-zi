import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import { MapCanvas, type LayerVisibility } from "@/components/gis/MapCanvas";
import { ADMIN_TREE, squareAround } from "@/lib/gis/demo-data";
import {
  ANALYSIS_STEPS,
  LEGAL_NOTICE,
  areaSqm,
  confidenceLabel,
  formatDate,
  formatNumber,
  perimeterM,
  runAnalysis,
  statusLabel,
} from "@/lib/gis/analysis";
import type { AnalysisResult, AoiSelection, DetectionFeature } from "@/lib/gis/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yer uchastkalari va qurilish monitoringi | GIS tizim" },
      {
        name: "description",
        content:
          "O'zbekiston hududidagi yer uchastkalari, kadastr chegaralari va yangi qurilishlarni sun'iy yo'ldosh tasvirlari asosida tahlil qiluvchi GIS platforma.",
      },
      { property: "og:title", content: "Yer uchastkalari va qurilish monitoringi" },
      {
        property: "og:description",
        content:
          "Kadastr polygonlari, eng so'nggi yuqori aniqlikdagi tasvir va avtomatlashtirilgan qurilish tahlili bir tizimda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonitoringPage,
});

type FilterKey =
  | "all"
  | "new"
  | "geometry_diff"
  | "conf_high"
  | "conf_mid"
  | "conf_low"
  | "review";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "new", label: "Yangi obyektlar" },
  { key: "geometry_diff", label: "Geometrik farq" },
  { key: "conf_high", label: "Yuqori ishonch" },
  { key: "conf_mid", label: "O'rta ishonch" },
  { key: "conf_low", label: "Past ishonch" },
  { key: "review", label: "Tekshiruv talab etiladi" },
];

function DemoBadge() {
  return (
    <span className="rounded-sm bg-warning/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-warning-foreground uppercase">
      Demo ma'lumot
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function MonitoringPage() {
  const [region, setRegion] = useState(ADMIN_TREE[0]!.name);
  const [district, setDistrict] = useState(ADMIN_TREE[0]!.children![0]!.name);
  const [mahalla, setMahalla] = useState(ADMIN_TREE[0]!.children![0]!.children![0]!.name);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [layers, setLayers] = useState<LayerVisibility>({
    parcels: true,
    detections: true,
    aoi: true,
    imagery: true,
  });
  const [opacity, setOpacity] = useState(1);
  const [drawMode, setDrawMode] = useState<"none" | "aoi" | "measure">("none");
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  const regions = ADMIN_TREE;
  const districts = regions.find((r) => r.name === region)?.children ?? [];
  const mahallas = districts.find((d) => d.name === district)?.children ?? [];

  const previewAoi: Feature<Polygon> | null = useMemo(() => {
    const center = mahallas.find((m) => m.name === mahalla)?.center;
    return center ? squareAround(center, 1.4) : null;
  }, [mahalla, mahallas]);

  const drawPolygon: Feature<Polygon> | null = useMemo(() => {
    if (drawPoints.length < 3) return null;
    return turf.polygon([[...drawPoints, drawPoints[0]!]]);
  }, [drawPoints]);

  const detections = result?.detections ?? [];
  const filtered = detections.filter((d) => {
    const c = d.properties.confidence ?? 0;
    switch (filter) {
      case "new":
        return d.properties.isNew;
      case "geometry_diff":
        return d.properties.status === "geometry_diff";
      case "conf_high":
        return c >= 0.85;
      case "conf_mid":
        return c >= 0.65 && c < 0.85;
      case "conf_low":
        return c < 0.65;
      case "review":
        return d.properties.status !== "matched";
      default:
        return true;
    }
  });

  const selectedParcel = result?.parcels.find((p) => p.properties.cadastralId === selected) ?? null;
  const parcelDetections = detections.filter((d) => d.properties.cadastralId === selected);

  async function startInspection(custom?: AoiSelection) {
    const aoi: AoiSelection | null =
      custom ??
      (previewAoi
        ? { label: mahalla, region, district, mahalla, feature: previewAoi }
        : null);
    if (!aoi) return;
    setError(null);
    setResult(null);
    setSelected(null);
    try {
      const res = await runAnalysis(aoi, setStep);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tahlil bajarilmadi.");
    } finally {
      setStep(null);
    }
  }

  function handleMapClick(lngLat: [number, number]) {
    setDrawPoints((prev) => [...prev, lngLat]);
  }

  function download(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportGeoJson() {
    if (!result) return;
    download(
      "tekshiruv.geojson",
      JSON.stringify(
        {
          type: "FeatureCollection",
          features: [result.aoi.feature, ...result.parcels, ...result.detections],
        },
        null,
        2,
      ),
      "application/geo+json",
    );
  }

  function exportCsv() {
    if (!result) return;
    const head = "kadastr_id;obyekt_id;maydon_m2;perimetr_m;ishonch;holat\n";
    const body = result.detections
      .map((d) =>
        [
          d.properties.cadastralId,
          d.properties.detectionId,
          d.properties.areaSqm,
          d.properties.perimeterM,
          d.properties.confidence ?? "",
          statusLabel(d.properties.status),
        ].join(";"),
      )
      .join("\n");
    download("tekshiruv.csv", head + body, "text/csv;charset=utf-8");
  }

  const stats = result
    ? {
        hectares: turf.area(result.aoi.feature) / 10000,
        parcels: result.parcels.length,
        detections: result.detections.length,
        changes: result.detections.filter((d) => d.properties.isNew).length,
        review: result.detections.filter((d) => d.properties.status === "not_found").length,
      }
    : null;

  const measureArea = drawPolygon ? areaSqm(drawPolygon) : 0;
  const measurePerimeter = drawPolygon ? perimeterM(drawPolygon) : 0;

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 py-2.5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">
            Yer uchastkalari va qurilish monitoringi tizimi
          </h1>
          <p className="text-xs text-muted-foreground">
            Kadastr chegaralari, sun'iy yo'ldosh tasvirlari va avtomatlashtirilgan tahlil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DemoBadge />
          <button
            onClick={() => setReportOpen(true)}
            disabled={!result}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Hisobot yaratish
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Chap panel */}
        <aside className="w-full shrink-0 overflow-y-auto border-b border-border bg-sidebar p-4 lg:w-[272px] lg:border-r lg:border-b-0">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Yangi tekshiruv
          </h2>
          <p className="mt-3 text-sm font-medium">Tekshiruv hududini tanlang</p>

          <label className="mt-3 block text-xs text-muted-foreground">Viloyat</label>
          <select
            value={region}
            onChange={(e) => {
              const r = regions.find((x) => x.name === e.target.value)!;
              setRegion(r.name);
              setDistrict(r.children![0]!.name);
              setMahalla(r.children![0]!.children![0]!.name);
            }}
            className="mt-1 w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
          >
            {regions.map((r) => (
              <option key={r.name}>{r.name}</option>
            ))}
          </select>

          <label className="mt-3 block text-xs text-muted-foreground">Tuman/shahar</label>
          <select
            value={district}
            onChange={(e) => {
              const d = districts.find((x) => x.name === e.target.value)!;
              setDistrict(d.name);
              setMahalla(d.children![0]!.name);
            }}
            className="mt-1 w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
          >
            {districts.map((d) => (
              <option key={d.name}>{d.name}</option>
            ))}
          </select>

          <label className="mt-3 block text-xs text-muted-foreground">Mahalla</label>
          <select
            value={mahalla}
            onChange={(e) => setMahalla(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
          >
            {mahallas.map((m) => (
              <option key={m.name}>{m.name}</option>
            ))}
          </select>

          <button
            onClick={() => startInspection()}
            disabled={step !== null}
            className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {step !== null ? "Tahlil bajarilmoqda..." : "Tekshiruvni boshlash"}
          </button>

          {drawPolygon && (
            <button
              onClick={() =>
                startInspection({
                  label: "Xaritada chizilgan hudud",
                  region,
                  district,
                  mahalla: "Chizilgan hudud",
                  feature: drawPolygon,
                })
              }
              className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Chizilgan hudud bo'yicha tekshirish
            </button>
          )}

          <h3 className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Qatlamlar
          </h3>
          <div className="mt-2 space-y-1.5 text-sm">
            {(
              [
                ["parcels", "Kadastr uchastkalari"],
                ["detections", "Aniqlangan obyektlar"],
                ["aoi", "Tekshiruv hududi"],
                ["imagery", "Asosiy xarita qatlami"],
              ] as [keyof LayerVisibility, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
                  className="accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
          <label className="mt-3 block text-xs text-muted-foreground">
            Shaffoflik: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="mt-1 w-full accent-primary"
          />

          <h3 className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Ma'lumot manbalari
          </h3>
          <div className="mt-2 space-y-2 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Kadastr:</span> rasmiy manba
              (open.ngis.uz) hali ulanmagan — namunaviy ma'lumot ko'rsatilmoqda.
            </p>
            <p>
              <span className="font-medium text-foreground">Tasvir:</span> yuqori aniqlikdagi
              litsenziyalangan manba ulanishi kutilmoqda.
            </p>
          </div>
        </aside>

        {/* Xarita */}
        <main className="relative min-h-[380px] flex-1">
          <MapCanvas
            aoi={result?.aoi.feature ?? drawPolygon ?? previewAoi}
            parcels={result?.parcels ?? []}
            detections={layers.detections ? filtered : []}
            layers={layers}
            opacity={opacity}
            selectedCadastralId={selected}
            drawMode={drawMode}
            drawPoints={drawPoints}
            onMapClick={handleMapClick}
            onSelectParcel={setSelected}
          />

          {step !== null && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
              <div className="rounded-md bg-card px-4 py-2 text-sm shadow-lg ring-1 ring-border">
                {ANALYSIS_STEPS[step]}
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-0 top-3 z-10 mx-auto w-fit rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-lg">
              {error}
            </div>
          )}

          {result && (
            <div className="absolute top-3 left-3 z-10 rounded-md bg-card/95 p-3 text-xs shadow-lg ring-1 ring-border">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-semibold">Eng so'nggi tasvir</span>
                <DemoBadge />
              </div>
              <div>Manba: {result.imagery.provider}</div>
              <div>Olingan sana: {formatDate(result.imagery.acquisitionDate)}</div>
              <div>Fazoviy aniqlik: {result.imagery.resolutionM} m</div>
              <div>Bulutlilik: {result.imagery.cloudCoverPct}%</div>
              <div>Tasvir ID: {result.imagery.imageId}</div>
            </div>
          )}

          {/* Asboblar */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-1 rounded-md bg-card/95 p-1 shadow-lg ring-1 ring-border">
            {(
              [
                ["none", "Tanlash"],
                ["measure", "Maydon o'lchash"],
                ["aoi", "Polygon chizish"],
              ] as ["none" | "measure" | "aoi", string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => {
                  setDrawMode(mode);
                  if (mode === "none") setDrawPoints([]);
                }}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  drawMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setDrawPoints([])}
              className="rounded px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Tozalash
            </button>
          </div>

          {drawPoints.length >= 3 && (
            <div className="absolute right-3 bottom-16 z-10 rounded-md bg-card/95 p-3 text-xs shadow-lg ring-1 ring-border">
              <div className="font-semibold">Qo'lda o'lchov</div>
              <div>Maydon: {formatNumber(measureArea, 2)} m²</div>
              <div>Perimetr: {formatNumber(measurePerimeter, 2)} m</div>
            </div>
          )}
        </main>

        {/* O'ng panel */}
        <aside className="w-full shrink-0 overflow-y-auto border-t border-border bg-card p-4 lg:w-[360px] lg:border-t-0 lg:border-l">
          {!result && step === null && (
            <div className="text-sm text-muted-foreground">
              Hudud tanlang va «Tekshiruvni boshlash» tugmasini bosing. Natijalar shu panelda
              ko'rsatiladi.
            </div>
          )}

          {result && (
            <>
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Tekshiruv natijasi
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  ["Tekshiruv hududi", `${formatNumber(stats!.hectares, 1)} ga`],
                  ["Yer uchastkalari", formatNumber(stats!.parcels)],
                  ["Aniqlangan obyektlar", formatNumber(stats!.detections)],
                  ["Yangi o'zgarishlar", formatNumber(stats!.changes)],
                  ["Qo'shimcha tekshiruv", formatNumber(stats!.review)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-secondary p-2">
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                    <div className="text-base font-semibold">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      filter === f.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-accent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {selectedParcel ? (
                <div className="mt-4 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Yer uchastkasi</h3>
                    <DemoBadge />
                  </div>
                  <div className="mt-2">
                    <Row label="Kadastr ID" value={selectedParcel.properties.cadastralId} />
                    <Row
                      label="Yer maydoni"
                      value={`${formatNumber(selectedParcel.properties.areaSqm)} m²`}
                    />
                    <Row
                      label="Mavjud bino maydoni"
                      value={`${formatNumber(selectedParcel.properties.registeredBuildingSqm)} m²`}
                    />
                    <Row label="Aniqlangan obyektlar" value={String(parcelDetections.length)} />
                    <Row label="Tasvir sanasi" value={formatDate(result.imagery.acquisitionDate)} />
                    <Row label="Tasvir aniqligi" value={`${result.imagery.resolutionM} m`} />
                  </div>
                  {parcelDetections.map((d) => (
                    <DetectionCard key={d.properties.detectionId} detection={d} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  Batafsil ma'lumot uchun xaritadan yer uchastkasini tanlang.
                </p>
              )}

              <h3 className="mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Aniqlangan obyektlar ({filtered.length})
              </h3>
              <div className="mt-2 space-y-1">
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Ushbu filtr bo'yicha obyekt topilmadi.
                  </p>
                )}
                {filtered.slice(0, 40).map((d) => (
                  <button
                    key={d.properties.detectionId}
                    onClick={() => setSelected(d.properties.cadastralId)}
                    className="flex w-full items-center justify-between rounded border border-border px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    <span>{d.properties.detectionId}</span>
                    <span className="text-muted-foreground">
                      {formatNumber(d.properties.areaSqm, 1)} m² ·{" "}
                      {confidenceLabel(d.properties.confidence)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={exportGeoJson}
                  className="flex-1 rounded-md border border-input px-2 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  GeoJSON
                </button>
                <button
                  onClick={exportCsv}
                  className="flex-1 rounded-md border border-input px-2 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  CSV
                </button>
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Hisobot
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {reportOpen && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">Tekshiruv hisoboti</h2>
              <DemoBadge />
            </div>
            <div className="mt-4">
              <Row label="Tekshiruv hududi" value={result.aoi.label} />
              <Row label="Viloyat" value={result.aoi.region ?? "—"} />
              <Row label="Tuman/shahar" value={result.aoi.district ?? "—"} />
              <Row label="Tekshiruv sanasi" value={formatDate(result.finishedAt)} />
              <Row label="Yer uchastkalari soni" value={formatNumber(stats!.parcels)} />
              <Row label="Tasvir manbasi" value={result.imagery.provider} />
              <Row label="Tasvir sanasi" value={formatDate(result.imagery.acquisitionDate)} />
              <Row label="Tasvir aniqligi" value={`${result.imagery.resolutionM} m`} />
              <Row label="Bulutlilik" value={`${result.imagery.cloudCoverPct}%`} />
              <Row label="Aniqlangan obyektlar" value={formatNumber(stats!.detections)} />
              <Row label="Yangi o'zgarishlar" value={formatNumber(stats!.changes)} />
              <Row
                label="Qo'shimcha tekshiruv talab etiladi"
                value={formatNumber(stats!.review)}
              />
            </div>
            <p className="mt-4 rounded-md bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
              {LEGAL_NOTICE}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
              >
                Chop etish / PDF
              </button>
              <button
                onClick={() => setReportOpen(false)}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetectionCard({ detection }: { detection: DetectionFeature }) {
  const p = detection.properties;
  return (
    <div className="mt-3 rounded-md bg-secondary p-2.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span>{p.detectionId}</span>
        <span className="text-muted-foreground">
          Ishonch: {p.confidence === null ? "—" : `${Math.round(p.confidence * 100)}%`} (
          {confidenceLabel(p.confidence)})
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Obyekt maydoni: {formatNumber(p.areaSqm, 1)} m² · Perimetri: {formatNumber(p.perimeterM, 1)}{" "}
        m
      </div>
      <div className="mt-1 text-xs font-medium">{statusLabel(p.status)}</div>
      {p.status !== "matched" && (
        <div className="mt-1 text-xs text-warning-foreground">
          Ehtimoliy o'zgarish — qo'shimcha tekshiruv talab etiladi.
        </div>
      )}
    </div>
  );
}
