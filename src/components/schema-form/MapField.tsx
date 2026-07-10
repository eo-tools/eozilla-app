import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Stack, useComputedColorScheme } from "@mantine/core";
import { IconPolygon, IconRectangle, IconTrash } from "@tabler/icons-react";

import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import { fromExtent } from "ol/geom/Polygon";
import Draw, { createBox } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import WKT from "ol/format/WKT";
import { transformExtent } from "ol/proj";
import { Fill, Stroke, Style } from "ol/style";
import "ol/ol.css";

import { FieldShell } from "./FieldShell";
import type { Field } from "@/utils/field";

type BBox = [number, number, number, number];

type MapValueType = "wkt" | "bbox";

interface MapFieldProps {
  field: Field;
  value: string | number[];
  onChange: (value: string | BBox) => void;
  hideLabel?: boolean;
  valueType?: MapValueType;
}

type DrawMode = "polygon" | "rectangle";
type DrawSketchState = {
  sketchFeature_: unknown;
  sketchPoint_: unknown;
  updateSketchFeatures_: () => void;
};

const wktFormat = new WKT();

const polygonStyle = new Style({
  stroke: new Stroke({
    color: "#1c7ed6",
    width: 2,
  }),
  fill: new Fill({
    color: "rgba(28, 126, 214, 0.12)",
  }),
});

const activeControlStyle = {
  backgroundColor: "rgba(116, 192, 252, 0.35)",
  color: "#1c7ed6",
} as const;

export function MapField({
  field,
  value,
  onChange,
  hideLabel,
  valueType = "wkt",
}: MapFieldProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const backgroundLayerRef = useRef<ReturnType<
    typeof createBackgroundLayer
  > | null>(null);
  const vectorSource = useMemo(() => new VectorSource(), []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>("rectangle");
  const colorScheme = useComputedColorScheme();
  const backgroundTheme = colorScheme === "dark" ? "dark" : "light";
  const initialBackgroundThemeRef = useRef<"dark" | "light">(backgroundTheme);
  const hasGeometry = hasMapValue(valueType, value);
  const handleDelete = () => {
    setErrorMessage(null);
    if (valueType === "bbox") {
      onChange([0, 0, 0, 0]);
      return;
    }
    onChange("");
  };

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const source3857 = vectorSource;
    const layer = new VectorLayer({
      source: source3857,
      style: polygonStyle,
    });
    const backgroundLayer = createBackgroundLayer(
      initialBackgroundThemeRef.current,
    );
    const map = new Map({
      target: mapElementRef.current,
      layers: [backgroundLayer, layer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    backgroundLayerRef.current = backgroundLayer;
    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      backgroundLayerRef.current = null;
      mapRef.current = null;
    };
  }, [vectorSource]);

  useEffect(() => {
    backgroundLayerRef.current?.setSource(
      createBackgroundSource(backgroundTheme),
    );
  }, [backgroundTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const modify = new Modify({
      source: vectorSource,
    });
    modify.on("modifyend", (event) => {
      const feature = event.features.item(0);
      if (!feature) {
        return;
      }
      syncValueFromFeature(feature, valueType, onChange, setErrorMessage);
    });
    map.addInteraction(modify);

    return () => {
      map.removeInteraction(modify);
    };
  }, [onChange, valueType, vectorSource]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const draw = createDrawInteraction(
      valueType === "bbox" ? "rectangle" : drawMode,
      vectorSource,
    );
    draw.on("drawend", (event) => {
      syncValueFromFeature(event.feature, valueType, onChange, setErrorMessage);
    });
    map.addInteraction(draw);

    const cleanupHoverPointerHandlers = setupHoverPointerHandlers(
      draw,
      map,
    );

    return () => {
      cleanupHoverPointerHandlers();
      map.removeInteraction(draw);
    };
  }, [drawMode, onChange, valueType, vectorSource]);

  useEffect(() => {
    if (valueType === "bbox") {
      syncBBoxSourceFromValue(value, vectorSource, setErrorMessage);
      return;
    }

    syncSourceFromValue(value, vectorSource, setErrorMessage);
  }, [valueType, value, vectorSource]);

  return (
    <FieldShell field={field} hideLabel={hideLabel}>
      <Stack gap="xs">
        <Box pos="relative">
          <Box
            ref={mapElementRef}
            style={{
              height: 320,
              overflow: "hidden",
            }}
          />
          {valueType === "wkt" || hasGeometry ? (
            <Box
              className="ol-unselectable ol-control"
              style={{
                position: "absolute",
                top: "4.5em",
                left: ".5em",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              {valueType === "wkt" ? (
                <>
                  <button
                    type="button"
                    aria-label="Draw rectangle"
                    title="Draw rectangle"
                    onClick={() => setDrawMode("rectangle")}
                    style={
                      drawMode === "rectangle" ? activeControlStyle : undefined
                    }
                  >
                    <IconRectangle size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Draw polygon"
                    title="Draw polygon"
                    onClick={() => setDrawMode("polygon")}
                    style={
                      drawMode === "polygon" ? activeControlStyle : undefined
                    }
                  >
                    <IconPolygon size={14} />
                  </button>
                </>
              ) : null}
              {hasGeometry ? (
                <button
                  type="button"
                  aria-label="Delete geometry"
                  title="Delete geometry"
                  onClick={handleDelete}
                >
                  <IconTrash size={14} />
                </button>
              ) : null}
            </Box>
          ) : null}
        </Box>
        {errorMessage ? (
          <Alert color="yellow" variant="light" py="xs">
            {errorMessage}
          </Alert>
        ) : null}
      </Stack>
    </FieldShell>
  );
}

function createBackgroundLayer(theme: "light" | "dark") {
  return new TileLayer({
    source: createBackgroundSource(theme),
  });
}

function createBackgroundSource(theme: "light" | "dark") {
  return theme === "dark"
    ? new XYZ({
        attributions: "© OpenStreetMap contributors © CARTO",
        attributionsCollapsible: false,
        url: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      })
    : new OSM();
}

function syncSourceFromValue(
  value: string | number[],
  source: VectorSource,
  setErrorMessage: (message: string | null) => void,
) {
  source.clear();

  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    setErrorMessage(null);
    return;
  }

  try {
    const feature = wktFormat.readFeature(trimmedValue, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });
    const geometry = feature.getGeometry();
    if (!geometry || geometry.getType() !== "Polygon") {
      setErrorMessage("Map fields currently support one POLYGON WKT value.");
      return;
    }

    source.addFeature(feature);
    setErrorMessage(null);
  } catch {
    setErrorMessage("Invalid geometry string. Expected a POLYGON WKT value.");
  }
}

function syncBBoxSourceFromValue(
  value: string | number[],
  source: VectorSource,
  setErrorMessage: (message: string | null) => void,
) {
  source.clear();

  if (!Array.isArray(value) || !isBBox(value)) {
    setErrorMessage("Expected bbox value [minLon, minLat, maxLon, maxLat].");
    return;
  }

  if (!hasArea(value)) {
    setErrorMessage(null);
    return;
  }

  try {
    const feature = new Feature({
      geometry: fromExtent(transformExtent(value, "EPSG:4326", "EPSG:3857")),
    });
    source.addFeature(feature);
    setErrorMessage(null);
  } catch {
    setErrorMessage("Invalid bbox value [minLon, minLat, maxLon, maxLat].");
  }
}

function syncValueFromFeature(
  feature: Parameters<WKT["writeFeature"]>[0],
  valueType: MapValueType,
  onChange: (value: string | BBox) => void,
  setErrorMessage: (message: string | null) => void,
) {
  if (valueType === "bbox") {
    const geometry = feature.getGeometry();
    if (!geometry) {
      setErrorMessage("No bbox geometry was drawn.");
      return;
    }

    const extent = transformExtent(
      geometry.getExtent(),
      "EPSG:3857",
      "EPSG:4326",
    );
    const bbox: BBox = [extent[0], extent[1], extent[2], extent[3]];
    setErrorMessage(null);
    onChange(bbox);
    return;
  }

  setErrorMessage(null);
  onChange(
    wktFormat.writeFeature(feature, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
      decimals: 6,
    }),
  );
}

function hasMapValue(valueType: MapValueType, value: string | number[]) {
  return valueType === "bbox"
    ? Array.isArray(value) && isBBox(value) && hasArea(value)
    : typeof value === "string" && value.trim().length > 0;
}

function isBBox(value: number[]): value is BBox {
  return value.length === 4 && value.every(Number.isFinite);
}

function hasArea([minLon, minLat, maxLon, maxLat]: BBox) {
  return minLon !== maxLon && minLat !== maxLat;
}

function createDrawInteraction(drawMode: DrawMode, source: VectorSource) {
  const draw = new Draw(
    drawMode === "rectangle"
      ? {
          source,
          type: "Circle",
          geometryFunction: createBox(),
        }
      : {
          source,
          type: "Polygon",
        },
  );

  draw.on("drawstart", () => {
    source.clear();
  });

  return draw;
}

function setupHoverPointerHandlers(draw: Draw, map: Map) {
  // OpenLayers keeps this pointer in the draw sketch overlay, not DOM cursor state.
  const hoverPointerSource = draw.getOverlay().getSource();
  const drawSketchState = getDrawSketchState(draw);
  const targetElement = map.getTargetElement();

  const handlePointerLeave = () => {
    if (!hoverPointerSource || isDrawInProgress(drawSketchState)) {
      return;
    }

    // Otherwise the idle hover pointer stays visible outside the map.
    hoverPointerSource.clear(true);
  };

  const handlePointerEnter = () => {
    if (!hasHoverPointer(drawSketchState)) {
      return;
    }

    // Otherwise it stays hidden until OpenLayers updates the sketch again.
    drawSketchState.updateSketchFeatures_();
  };

  targetElement.addEventListener("mouseleave", handlePointerLeave);
  targetElement.addEventListener("mouseenter", handlePointerEnter);

  return () => {
    targetElement.removeEventListener("mouseleave", handlePointerLeave);
    targetElement.removeEventListener("mouseenter", handlePointerEnter);
    hoverPointerSource?.clear(true);
  };
}

function isDrawInProgress(draw: DrawSketchState) {
  return Boolean(draw.sketchFeature_);
}

function hasHoverPointer(draw: DrawSketchState) {
  return !isDrawInProgress(draw) && Boolean(draw.sketchPoint_);
}

function getDrawSketchState(draw: Draw) {
  return draw as unknown as DrawSketchState;
}
