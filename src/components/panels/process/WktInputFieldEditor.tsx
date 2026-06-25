import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import WKT from "ol/format/WKT.js";
import type Geometry from "ol/geom/Geometry.js";
import Draw from "ol/interaction/Draw.js";
import VectorSource from "ol/source/Vector.js";

import type { Input } from "@/service";
import { useOlFeatureEditor } from "./useOlFeatureEditor";

type WktDrawType = "Point" | "LineString" | "Polygon";

export interface WktInputFieldEditorProps {
  inputName: string;
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export function WktInputFieldEditor({
  inputName,
  inputValue,
  setInputValue,
}: WktInputFieldEditorProps) {
  const format = useMemo(() => new WKT(), []);
  const [drawType, setDrawType] = useState<WktDrawType>("Polygon");

  const wktValue = typeof inputValue === "string" ? inputValue.trim() : "";
  const { geometry, errorText } = useMemo(() => {
    if (!wktValue) {
      return { geometry: undefined, errorText: undefined as string | undefined };
    }
    try {
      return {
        geometry: format.readGeometry(wktValue, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }),
        errorText: undefined as string | undefined,
      };
    } catch (_error) {
      return {
        geometry: undefined,
        errorText: "Could not parse WKT geometry.",
      };
    }
  }, [format, wktValue]);

  const createDraw = useCallback(
    (source: VectorSource) =>
      new Draw({
        source,
        type: drawType,
      }),
    [drawType],
  );

  const writeValue = useCallback(
    (nextGeometry: Geometry | undefined) => {
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
    [format, inputName, setInputValue],
  );

  const { containerRef, setGeometry } = useOlFeatureEditor({
    createDraw,
    writeValue,
  });

  useEffect(() => {
    setGeometry(wktValue ? geometry : undefined);
  }, [geometry, setGeometry, wktValue]);

  return (
    <Stack gap={"xs"}>
      <div ref={containerRef} className="map-input-editor-map" />
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          Draw one geometry. Existing WKT is loaded and can be modified.
        </Text>
        <Group gap="xs">
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
          <Button
            variant="default"
            size="xs"
            disabled={!wktValue}
            onClick={() => setInputValue(inputName, "")}
          >
            Clear
          </Button>
        </Group>
      </Group>
      {errorText && (
        <Text size="xs" c="red">
          {errorText}
        </Text>
      )}
      {wktValue && (
        <Text size="xs" ff="monospace">
          {wktValue}
        </Text>
      )}
    </Stack>
  );
}
