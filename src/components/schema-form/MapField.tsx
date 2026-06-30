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

import Map from "ol/Map";
import View from "ol/View";
import Draw, { createBox } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import WKT from "ol/format/WKT";
import { Fill, Stroke, Style } from "ol/style";
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

const activeControlStyle = {
  backgroundColor: "rgba(116, 192, 252, 0.35)",
  color: "#1c7ed6",
} as const;

export function MapField({
  field,
  value,
  onChange,
  hideLabel,
}: MapFieldProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const onChangeRef = useRef(onChange);
  const vectorSource = useMemo(() => new VectorSource(), []);
  const isSyncingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>("rectangle");
  const hasGeometry = value.trim().length > 0;
  const handleDelete = () => {
    setErrorMessage(null);
    onChange("");
  };

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
    const handleFeatureChange = (event: { feature?: Parameters<WKT["writeFeature"]>[0] }) => {
      if (!event.feature) {
        return;
      }
      syncValueFromFeature(
        event.feature,
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

    const draw = createDrawInteraction(drawMode, vectorSource);
    map.addInteraction(draw);

    return () => {
      map.removeInteraction(draw);
    };
  }, [drawMode, vectorSource]);

  useEffect(() => {
    syncSourceFromValue(value, vectorSource, setErrorMessage, isSyncingRef);
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
            <button
              type="button"
              aria-label="Draw rectangle"
              title="Draw rectangle"
              onClick={() => setDrawMode("rectangle")}
              style={drawMode === "rectangle" ? activeControlStyle : undefined}
            >
              <IconRectangle size={14} />
            </button>
            <button
              type="button"
              aria-label="Draw polygon"
              title="Draw polygon"
              onClick={() => setDrawMode("polygon")}
              style={drawMode === "polygon" ? activeControlStyle : undefined}
            >
              <IconPolygon size={14} />
            </button>
            {hasGeometry ? (
              <button
                type="button"
                aria-label="Delete polygon"
                title="Delete polygon"
                onClick={handleDelete}
              >
                <IconTrash size={14} />
              </button>
            ) : null}
          </Box>
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
  value: string,
  source: VectorSource,
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
  } catch {
    setErrorMessage("Invalid geometry string. Expected a POLYGON WKT value.");
  } finally {
    isSyncingRef.current = false;
  }
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
