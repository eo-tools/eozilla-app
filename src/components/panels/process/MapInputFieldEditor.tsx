import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import WKT from "ol/format/WKT.js";
import type Geometry from "ol/geom/Geometry.js";
import { fromExtent as polygonFromExtent } from "ol/geom/Polygon.js";
import Draw, { createBox } from "ol/interaction/Draw.js";
import { transformExtent } from "ol/proj.js";
import VectorSource from "ol/source/Vector.js";

import type { Input } from "@/service";
import type { Field } from "@/utils/field";
import { isArraySchema, isStringSchema } from "@/utils/json";
import { useOlFeatureEditor } from "./useOlFeatureEditor";

type WktDrawType = "Point" | "LineString" | "Polygon";
type MapInputMode = "bbox" | "wkt" | "unsupported";

export interface MapInputFieldEditorProps {
  inputName: string;
  inputSchema: Field["schema"];
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export function MapInputFieldEditor({
  inputName,
  inputSchema,
  inputValue,
  setInputValue,
}: MapInputFieldEditorProps) {
  const format = useMemo(() => new WKT(), []);
  const mode = getMapInputMode(inputSchema);
  const [drawType, setDrawType] = useState<WktDrawType>("Polygon");

  const parsedValue = useMemo(
    () => parseMapInputValue(mode, format, inputValue),
    [format, inputValue, mode],
  );

  const createDraw = useCallback(
    (source: VectorSource) => {
      if (mode === "bbox") {
        return new Draw({
          source,
          type: "Circle",
          geometryFunction: createBox(),
        });
      }

      return new Draw({
        source,
        type: drawType,
      });
    },
    [drawType, mode],
  );

  const writeValue = useCallback(
    (nextGeometry: Geometry | undefined) => {
      if (mode === "bbox") {
        if (!nextGeometry) {
          setInputValue(inputName, getEmptyBbox());
          return;
        }
        const [minX, minY, maxX, maxY] = transformExtent(
          nextGeometry.getExtent(),
          "EPSG:3857",
          "EPSG:4326",
        );
        setInputValue(inputName, [
          Number(minX.toFixed(6)),
          Number(minY.toFixed(6)),
          Number(maxX.toFixed(6)),
          Number(maxY.toFixed(6)),
        ]);
        return;
      }

      if (!nextGeometry) {
        setInputValue(inputName, "");
        return;
      }

      setInputValue(
        inputName,
        format.writeGeometry(nextGeometry, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
          decimals: 6,
        }),
      );
    },
    [format, inputName, mode, setInputValue],
  );

  const { containerRef, setGeometry } = useOlFeatureEditor({
    createDraw,
    writeValue,
  });

  useEffect(() => {
    setGeometry(parsedValue.geometry);
  }, [parsedValue.geometry, setGeometry]);

  return (
    <Stack gap="xs">
      <div ref={containerRef} className="map-input-editor-map" />
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          {getHelperText(mode)}
        </Text>
        <Group gap="xs">
          {mode === "wkt" && (
            <Select
              size="xs"
              w={140}
              data={[
                { value: "Point", label: "Point" },
                { value: "LineString", label: "Line" },
                { value: "Polygon", label: "Polygon" },
              ]}
              value={drawType}
              onChange={(value) => {
                if (
                  value === "Point" ||
                  value === "LineString" ||
                  value === "Polygon"
                ) {
                  setDrawType(value);
                }
              }}
            />
          )}
          <Button
            variant="default"
            size="xs"
            disabled={!parsedValue.displayValue}
            onClick={() => {
              if (mode === "bbox") {
                setInputValue(inputName, getEmptyBbox());
              } else {
                setInputValue(inputName, "");
              }
            }}
          >
            Clear
          </Button>
        </Group>
      </Group>
      {parsedValue.errorText && (
        <Text size="xs" c="red">
          {parsedValue.errorText}
        </Text>
      )}
      {parsedValue.displayValue && (
        <Text size="xs" ff="monospace">
          {parsedValue.displayValue}
        </Text>
      )}
    </Stack>
  );
}

function getMapInputMode(inputSchema: Field["schema"]): MapInputMode {
  if (
    isArraySchema(inputSchema) &&
    getSchemaFormat(inputSchema) === "bbox"
  ) {
    return "bbox";
  }

  if (isStringSchema(inputSchema)) {
    return "wkt";
  }

  return "unsupported";
}

function getSchemaFormat(inputSchema: Field["schema"]): string | undefined {
  const schemaRecord = inputSchema as Record<string, unknown>;
  return typeof schemaRecord.format === "string"
    ? schemaRecord.format
    : undefined;
}

function parseMapInputValue(
  mode: MapInputMode,
  format: WKT,
  inputValue: Input,
): {
  geometry: Geometry | undefined;
  errorText: string | undefined;
  displayValue: string | undefined;
} {
  if (mode === "bbox") {
    if (!Array.isArray(inputValue) || inputValue.length !== 4) {
      return {
        geometry: undefined,
        errorText: "Expected bbox as [minX, minY, maxX, maxY].",
        displayValue: undefined,
      };
    }

    const bbox = inputValue.map((value) => Number(value));
    if (bbox.some((value) => !Number.isFinite(value))) {
      return {
        geometry: undefined,
        errorText: "Expected bbox as [minX, minY, maxX, maxY].",
        displayValue: undefined,
      };
    }

    return {
      geometry: polygonFromExtent(
        transformExtent(
          bbox as [number, number, number, number],
          "EPSG:4326",
          "EPSG:3857",
        ),
      ),
      errorText: undefined,
      displayValue: `[${bbox.map((value) => Number(value.toFixed(6))).join(", ")}]`,
    };
  }

  if (mode === "wkt") {
    const wktValue = typeof inputValue === "string" ? inputValue.trim() : "";
    if (!wktValue) {
      return {
        geometry: undefined,
        errorText: undefined,
        displayValue: undefined,
      };
    }

    try {
      return {
        geometry: format.readGeometry(wktValue, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }),
        errorText: undefined,
        displayValue: wktValue,
      };
    } catch (_error) {
      return {
        geometry: undefined,
        errorText: "Could not parse WKT geometry.",
        displayValue: wktValue,
      };
    }
  }

  return {
    geometry: undefined,
    errorText: "Unsupported map input schema.",
    displayValue: undefined,
  };
}

function getEmptyBbox(): Input {
  return [0, 0, 0, 0];
}

function getHelperText(mode: MapInputMode) {
  if (mode === "bbox") {
    return "Draw one rectangle to define the bounding box.";
  }

  if (mode === "wkt") {
    return "Draw one geometry. Existing WKT is loaded and can be modified.";
  }

  return "This map field schema is not supported.";
}
