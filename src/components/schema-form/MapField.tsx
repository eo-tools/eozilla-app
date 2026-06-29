import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconPolygon,
  IconRectangle,
  IconTrash,
} from "@tabler/icons-react";

import Map from "ol/Map";
import View from "ol/View";
import Draw, { createBox } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromExtent } from "ol/geom/Polygon";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import WKT from "ol/format/WKT";
import { Fill, Stroke, Style } from "ol/style";
import { getCenter } from "ol/extent";
import "ol/ol.css";

import { FieldShell } from "./FieldShell";
import type { Field } from "@/utils/field";

interface MapFieldProps {
  field: Field;
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
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

export function MapField({
  field,
  value,
  onChange,
  hideLabel,
}: MapFieldProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<Draw | null>(null);
  const onChangeRef = useRef(onChange);
  const vectorSource = useMemo(() => new VectorSource(), []);
  const isSyncingRef = useRef(false);
  const isClearingForRedrawRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>("polygon");
  const hasGeometry = value.trim().length > 0;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
    source3857.on("addfeature", (event) => {
      if (!event.feature) {
        return;
      }
      syncValueFromFeature(
        event.feature,
        onChangeRef,
        setErrorMessage,
        isSyncingRef,
      );
    });
    source3857.on("changefeature", () => {
      syncValueFromSource(
        source3857,
        onChangeRef,
        setErrorMessage,
        isSyncingRef,
      );
    });
    source3857.on("removefeature", () => {
      if (isSyncingRef.current || isClearingForRedrawRef.current) {
        return;
      }
      setErrorMessage(null);
      onChangeRef.current("");
    });

    map.addInteraction(modify);
    mapRef.current = map;

    return () => {
      drawRef.current = null;
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [vectorSource]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
    }

    const draw = createDrawInteraction(drawMode, vectorSource, map, {
      onChangeRef,
      setErrorMessage,
      isSyncingRef,
      isClearingForRedrawRef,
    });
    drawRef.current = draw;
    map.addInteraction(draw);

    return () => {
      if (drawRef.current === draw) {
        map.removeInteraction(draw);
        drawRef.current = null;
      }
    };
  }, [drawMode, vectorSource]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    syncSourceFromValue(value, vectorSource, map, setErrorMessage, isSyncingRef);
  }, [value, vectorSource]);

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
          <Stack
            gap="xs"
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              zIndex: 1,
            }}
          >
            <Tooltip label="Draw polygon" position="right">
              <ActionIcon
                aria-label="Draw polygon"
                color={drawMode === "polygon" ? "blue" : "gray"}
                variant={drawMode === "polygon" ? "filled" : "default"}
                size="sm"
                onClick={() => setDrawMode("polygon")}
              >
                <IconPolygon size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Draw rectangle" position="right">
              <ActionIcon
                aria-label="Draw rectangle"
                color={drawMode === "rectangle" ? "blue" : "gray"}
                variant={drawMode === "rectangle" ? "filled" : "default"}
                size="sm"
                onClick={() => setDrawMode("rectangle")}
              >
                <IconRectangle size={14} />
              </ActionIcon>
            </Tooltip>
            {hasGeometry ? (
              <Tooltip label="Delete polygon" position="left">
                <ActionIcon
                  aria-label="Delete polygon"
                  color="red"
                  variant="filled"
                  size="sm"
                  onClick={() => {
                    setErrorMessage(null);
                    onChange("");
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            ) : null}
          </Stack>
        </Box>
        <Text size="xs" c="dimmed">
          Map widget for geometry strings. Rectangle drawing is stored as polygon WKT.
        </Text>
        {errorMessage ? (
          <Alert color="yellow" variant="light" py="xs">
            {errorMessage}
          </Alert>
        ) : null}
        <Textarea
          label="WKT"
          autosize
          minRows={3}
          maxRows={8}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </Stack>
    </FieldShell>
  );
}

function syncSourceFromValue(
  value: string,
  source: VectorSource,
  map: Map,
  setErrorMessage: (message: string | null) => void,
  isSyncingRef: { current: boolean },
) {
  const trimmedValue = value.trim();
  isSyncingRef.current = true;
  source.clear();

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
    fitToSource(map, source);
  } catch {
    setErrorMessage("Invalid geometry string. Expected a POLYGON WKT value.");
  } finally {
    isSyncingRef.current = false;
  }
}

function syncValueFromSource(
  source: VectorSource,
  onChangeRef: { current: (value: string) => void },
  setErrorMessage: (message: string | null) => void,
  isSyncingRef: { current: boolean },
) {
  if (isSyncingRef.current) {
    return;
  }

  const features = source.getFeatures();
  const feature = features[0];
  if (!feature) {
    setErrorMessage(null);
    onChangeRef.current("");
    return;
  }

  const geometry = feature.getGeometry();
  if (!geometry || geometry.getType() !== "Polygon") {
    setErrorMessage("Map fields currently support one POLYGON WKT value.");
    return;
  }

  syncValueFromFeature(feature, onChangeRef, setErrorMessage, isSyncingRef);
}

function syncValueFromFeature(
  feature: Parameters<WKT["writeFeature"]>[0],
  onChangeRef: { current: (value: string) => void },
  setErrorMessage: (message: string | null) => void,
  isSyncingRef: { current: boolean },
) {
  if (isSyncingRef.current) {
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

function fitToSource(map: Map, source: VectorSource) {
  const extent = source.getExtent();
  if (!extent || !extent.every(Number.isFinite)) {
    return;
  }

  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  const view = map.getView();

  if (width === 0 || height === 0) {
    view.animate({
      center: getCenter(extent),
      zoom: 12,
      duration: 150,
    });
    return;
  }

  view.fit(fromExtent(extent), {
    padding: [24, 24, 24, 24],
    maxZoom: 16,
    duration: 150,
  });
}

function createDrawInteraction(
  drawMode: DrawMode,
  source: VectorSource,
  map: Map,
  deps: {
    onChangeRef: { current: (value: string) => void };
    setErrorMessage: (message: string | null) => void;
    isSyncingRef: { current: boolean };
    isClearingForRedrawRef: { current: boolean };
  },
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
    clearSourceForRedraw(source, deps.isClearingForRedrawRef);
  });
  draw.on("drawend", () => {
    fitToSource(map, source);
  });

  return draw;
}

function clearSourceForRedraw(
  source: VectorSource,
  isClearingForRedrawRef: { current: boolean },
) {
  isClearingForRedrawRef.current = true;
  source.clear();
  queueMicrotask(() => {
    isClearingForRedrawRef.current = false;
  });
}
