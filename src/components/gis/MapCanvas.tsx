import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { DetectionFeature, ParcelFeature } from "@/lib/gis/types";

export interface LayerVisibility {
  parcels: boolean;
  detections: boolean;
  aoi: boolean;
  imagery: boolean;
}

interface MapCanvasProps {
  aoi: Feature<Polygon> | null;
  parcels: ParcelFeature[];
  detections: DetectionFeature[];
  layers: LayerVisibility;
  opacity: number;
  selectedCadastralId: string | null;
  drawMode: "none" | "aoi" | "measure";
  drawPoints: [number, number][];
  onMapClick: (lngLat: [number, number]) => void;
  onSelectParcel: (cadastralId: string | null) => void;
}

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

export function MapCanvas(props: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const handlersRef = useRef(props);
  handlersRef.current = props;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [66.9597, 39.6542],
      zoom: 11,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      map.addSource("aoi", { type: "geojson", data: EMPTY });
      map.addSource("parcels", { type: "geojson", data: EMPTY });
      map.addSource("detections", { type: "geojson", data: EMPTY });
      map.addSource("draw", { type: "geojson", data: EMPTY });

      map.addLayer({
        id: "aoi-fill",
        type: "fill",
        source: "aoi",
        paint: { "fill-color": "#0f766e", "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "aoi-line",
        type: "line",
        source: "aoi",
        paint: { "line-color": "#0f766e", "line-width": 2, "line-dasharray": [2, 2] },
      });
      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#15803d",
            "#94a3b8",
          ],
          "fill-opacity": 0.25,
        },
      });
      map.addLayer({
        id: "parcels-line",
        type: "line",
        source: "parcels",
        paint: { "line-color": "#334155", "line-width": 1 },
      });
      map.addLayer({
        id: "detections-fill",
        type: "fill",
        source: "detections",
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "matched",
            "#16a34a",
            "geometry_diff",
            "#eab308",
            "#dc2626",
          ],
          "fill-opacity": 0.55,
        },
      });
      map.addLayer({
        id: "detections-line",
        type: "line",
        source: "detections",
        paint: { "line-color": "#0f172a", "line-width": 1 },
      });
      map.addLayer({
        id: "draw-fill",
        type: "fill",
        source: "draw",
        paint: { "fill-color": "#15803d", "fill-opacity": 0.18 },
      });
      map.addLayer({
        id: "draw-line",
        type: "line",
        source: "draw",
        paint: { "line-color": "#15803d", "line-width": 2 },
      });

      readyRef.current = true;
      sync();
    });

    map.on("click", (event) => {
      const p = handlersRef.current;
      const lngLat: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      if (p.drawMode !== "none") {
        p.onMapClick(lngLat);
        return;
      }
      const hits = map.queryRenderedFeatures(event.point, { layers: ["parcels-fill"] });
      const id = hits[0]?.properties?.["cadastralId"];
      p.onSelectParcel(typeof id === "string" ? id : null);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  const sync = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const { aoi, parcels, detections, layers, opacity, selectedCadastralId, drawPoints } =
      handlersRef.current;

    (map.getSource("aoi") as maplibregl.GeoJSONSource | undefined)?.setData(
      aoi ? { type: "FeatureCollection", features: [aoi] } : EMPTY,
    );
    (map.getSource("parcels") as maplibregl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: parcels,
    } as FeatureCollection);
    (map.getSource("detections") as maplibregl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: detections,
    } as FeatureCollection);

    const drawData: FeatureCollection =
      drawPoints.length >= 3
        ? {
            type: "FeatureCollection",
            features: [turf.polygon([[...drawPoints, drawPoints[0] as [number, number]]])],
          }
        : drawPoints.length === 2
          ? { type: "FeatureCollection", features: [turf.lineString(drawPoints)] }
          : drawPoints.length === 1
            ? { type: "FeatureCollection", features: [turf.point(drawPoints[0] as number[])] }
            : EMPTY;
    (map.getSource("draw") as maplibregl.GeoJSONSource | undefined)?.setData(drawData);

    const setVis = (id: string, visible: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    };
    setVis("aoi-fill", layers.aoi);
    setVis("aoi-line", layers.aoi);
    setVis("parcels-fill", layers.parcels);
    setVis("parcels-line", layers.parcels);
    setVis("detections-fill", layers.detections);
    setVis("detections-line", layers.detections);
    setVis("osm", layers.imagery);
    if (map.getLayer("osm")) map.setPaintProperty("osm", "raster-opacity", opacity);

    if (map.getLayer("parcels-fill")) {
      map.setPaintProperty("parcels-fill", "fill-color", [
        "case",
        ["==", ["get", "cadastralId"], selectedCadastralId ?? "__none__"],
        "#15803d",
        "#94a3b8",
      ]);
    }
  };

  useEffect(sync, [
    props.aoi,
    props.parcels,
    props.detections,
    props.layers,
    props.opacity,
    props.selectedCadastralId,
    props.drawPoints,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.aoi) return;
    const [minX, minY, maxX, maxY] = turf.bbox(props.aoi) as [number, number, number, number];
    map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ],
      { padding: 60, duration: 800 },
    );
  }, [props.aoi]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
