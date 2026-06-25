import { useCallback, useEffect, useMemo } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import type Geometry from "ol/geom/Geometry.js";
import { fromExtent as polygonFromExtent } from "ol/geom/Polygon.js";
import Draw, { createBox } from "ol/interaction/Draw.js";
import VectorSource from "ol/source/Vector.js";
import { transformExtent } from "ol/proj.js";

import type { Input } from "@/service";
import { useOlFeatureEditor } from "./useOlFeatureEditor";

export interface BboxInputFieldEditorProps {
  inputName: string;
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

function getEmptyBbox(): Input {
  return [0, 0, 0, 0];
}

export function BboxInputFieldEditor({
  inputName,
  inputValue,
  setInputValue,
}: BboxInputFieldEditorProps) {
  const { geometry, errorText, bboxText } = useMemo(() => {
    if (!Array.isArray(inputValue) || inputValue.length !== 4) {
      return {
        geometry: undefined,
        errorText: "Expected bbox as [minX, minY, maxX, maxY].",
        bboxText: undefined as string | undefined,
      };
    }
    const bbox = inputValue.map((value) => Number(value));
    if (bbox.some((value) => !Number.isFinite(value))) {
      return {
        geometry: undefined,
        errorText: "Expected bbox as [minX, minY, maxX, maxY].",
        bboxText: undefined as string | undefined,
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
      errorText: undefined as string | undefined,
      bboxText: `[${bbox.map((value) => Number(value.toFixed(6))).join(", ")}]`,
    };
  }, [inputValue]);

  const createDraw = useCallback(
    (source: VectorSource) =>
      new Draw({
        source,
        type: "Circle",
        geometryFunction: createBox(),
      }),
    [],
  );

  const writeValue = useCallback(
    (nextGeometry: Geometry | undefined) => {
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
    },
    [inputName, setInputValue],
  );

  const { containerRef, setGeometry } = useOlFeatureEditor({
    createDraw,
    writeValue,
  });

  useEffect(() => {
    setGeometry(bboxText ? geometry : undefined);
  }, [bboxText, geometry, setGeometry]);

  return (
    <Stack gap={"xs"}>
      <div ref={containerRef} className="map-input-editor-map" />
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          Draw one rectangle to define the bounding box.
        </Text>
        <Button
          variant="default"
          size="xs"
          disabled={!bboxText}
          onClick={() => setInputValue(inputName, getEmptyBbox())}
        >
          Clear
        </Button>
      </Group>
      {errorText && (
        <Text size="xs" c="red">
          {errorText}
        </Text>
      )}
      {bboxText && (
        <Text size="xs" ff="monospace">
          {bboxText}
        </Text>
      )}
    </Stack>
  );
}
