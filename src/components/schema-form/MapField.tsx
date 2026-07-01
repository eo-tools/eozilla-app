import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Stack,
} from "@mantine/core";
import {
  IconPolygon,
  IconRectangle,
  IconTrash,
} from "@tabler/icons-react";

import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import { fromExtent } from "ol/geom/Polygon";
import Draw, { createBox } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
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
  const valueTypeRef = useRef<MapValueType>(valueType);
  const onChangeRef = useRef(onChange);
  const vectorSource = useMemo(() => new VectorSource(), []);
  const isSyncingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>("rectangle");
  const hasGeometry = hasMapValue(valueType, value);
  const handleDelete = () => {
    setErrorMessage(null);
    if (valueType === "bbox") {
      onChangeRef.current([0, 0, 0, 0]);
      return;
    }
    onChangeRef.current("");
  };

  useEffect(() => {
    valueTypeRef.current = valueType;
    onChangeRef.current = onChange;
  }, [valueType, onChange]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const source3857 = vectorSource;
    const layer = new VectorLayer({
      source: source3857,
      style: polygonStyle,
    });
    const map = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        layer,
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    const modify = new Modify({
      source: source3857,
    });
    const handleFeatureChange = (event: { feature?: Parameters<WKT["writeFeature"]>[0] }) => {
      if (!event.feature) {
        return;
      }
      syncValueFromFeature(
        event.feature,
        valueTypeRef,
        onChangeRef,
        setErrorMessage,
        isSyncingRef,
      );
    };
    source3857.on("addfeature", handleFeatureChange);
    source3857.on("changefeature", handleFeatureChange);

    map.addInteraction(modify);
    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [vectorSource]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const draw = createDrawInteraction(
      valueType === "bbox" ? "rectangle" : drawMode,
      vectorSource,
    );
    map.addInteraction(draw);

    return () => {
      map.removeInteraction(draw);
    };
  }, [drawMode, valueType, vectorSource]);

  useEffect(() => {
    if (valueType === "bbox") {
      syncBBoxSourceFromValue(
        value,
        vectorSource,
        setErrorMessage,
        isSyncingRef,
      );
      return;
    }

    syncSourceFromValue(
      value,
      vectorSource,
      setErrorMessage,
      isSyncingRef,
    );
  }, [valueType, value, vectorSource]);

  return (
    <FieldShell field={field} hideLabel={hideLabel}>
      <Stack gap="xs">
        <Box pos="relative">
          <Box
            ref={mapElementRef}
            style={{
              height: 320,
              border: "1px solid var(--mantine-color-gray-4)",
              borderRadius: "var(--mantine-radius-sm)",
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

function syncSourceFromValue(
  value: string | number[],
  source: VectorSource,
  setErrorMessage: (message: string | null) => void,
  isSyncingRef: { current: boolean },
) {
  isSyncingRef.current = true;
  source.clear();

  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    setErrorMessage(null);
    isSyncingRef.current = false;
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
      isSyncingRef.current = false;
      return;
    }

    source.addFeature(feature);
    setErrorMessage(null);
  } catch {
    setErrorMessage("Invalid geometry string. Expected a POLYGON WKT value.");
  } finally {
    isSyncingRef.current = false;
  }
}

function syncBBoxSourceFromValue(
  value: string | number[],
  source: VectorSource,
  setErrorMessage: (message: string | null) => void,
  isSyncingRef: { current: boolean },
) {
  isSyncingRef.current = true;
  source.clear();

  if (!Array.isArray(value) || !isBBox(value)) {
    setErrorMessage("Expected bbox value [minLon, minLat, maxLon, maxLat].");
    isSyncingRef.current = false;
    return;
  }

  if (!hasArea(value)) {
    setErrorMessage(null);
    isSyncingRef.current = false;
    return;
  }

  try {
    const feature = new Feature({
      geometry: fromExtent(
        transformExtent(value, "EPSG:4326", "EPSG:3857"),
      ),
    });
    source.addFeature(feature);
    setErrorMessage(null);
  } catch {
    setErrorMessage("Invalid bbox value [minLon, minLat, maxLon, maxLat].");
  } finally {
    isSyncingRef.current = false;
  }
}

function syncValueFromFeature(
  feature: Parameters<WKT["writeFeature"]>[0],
  valueTypeRef: { current: MapValueType },
  onChangeRef: { current: (value: string | BBox) => void },
  setErrorMessage: (message: string | null) => void,
  isSyncingRef: { current: boolean },
) {
  if (isSyncingRef.current) {
    return;
  }

  if (valueTypeRef.current === "bbox") {
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
    const bbox: BBox = [
      extent[0],
      extent[1],
      extent[2],
      extent[3],
    ];
    setErrorMessage(null);
    onChangeRef.current(bbox);
    return;
  }

  setErrorMessage(null);
  onChangeRef.current(
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

function createDrawInteraction(
  drawMode: DrawMode,
  source: VectorSource,
) {
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
