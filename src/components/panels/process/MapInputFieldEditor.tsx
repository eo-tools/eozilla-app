import { useEffect, useRef, useState } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import "ol/ol.css";
import Feature from "ol/Feature.js";
import Map from "ol/Map.js";
import View from "ol/View.js";
import WKT from "ol/format/WKT.js";
import Draw from "ol/interaction/Draw.js";
import Modify from "ol/interaction/Modify.js";
import Snap from "ol/interaction/Snap.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import { unByKey } from "ol/Observable.js";
import OSM from "ol/source/OSM.js";
import VectorSource from "ol/source/Vector.js";
import { fromLonLat } from "ol/proj.js";

import type { Input } from "@/service";

export interface MapInputFieldEditorProps {
  inputName: string;
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export function MapInputFieldEditor({
  inputName,
  inputValue,
  setInputValue,
}: MapInputFieldEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef(new VectorSource());
  const mapRef = useRef<Map | null>(null);
  const formatRef = useRef(new WKT());
  const syncingRef = useRef(false);
  const [errorText, setErrorText] = useState<string>();

  const resetView = () => {
    const view = mapRef.current?.getView();
    view?.setCenter(fromLonLat([11, 48]));
    view?.setZoom(4);
  };

  const fitCurrentGeometry = () => {
    const map = mapRef.current;
    const view = map?.getView();
    const geometry = sourceRef.current.getFeatures()[0]?.getGeometry();
    if (!map || !view || !geometry) {
      return;
    }
    map.updateSize();
    view.fit(geometry.getExtent(), {
      padding: [24, 24, 24, 24],
      maxZoom: 12,
    });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const source = sourceRef.current;
    const map = new Map({
      target: containerRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source,
        }),
      ],
      view: new View({
        center: fromLonLat([11, 48]),
        zoom: 4,
      }),
    });
    const modify = new Modify({ source });
    const draw = new Draw({
      source,
      type: "Polygon",
    });
    const snap = new Snap({ source });

    const syncFeatureToInput = () => {
      if (syncingRef.current) {
        return;
      }
      const feature = source.getFeatures()[0];
      const geometry = feature?.getGeometry();
      if (!geometry) {
        setInputValue(inputName, "");
        return;
      }
      setInputValue(
        inputName,
        formatRef.current.writeGeometry(geometry, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
          decimals: 6,
        }),
      );
    };

    map.addInteraction(modify);
    map.addInteraction(draw);
    map.addInteraction(snap);

    const addFeatureKey = source.on("addfeature", syncFeatureToInput);
    const modifyEndKey = modify.on("modifyend", syncFeatureToInput);
    const drawStartKey = draw.on("drawstart", () => {
      syncingRef.current = true;
      source.clear();
      syncingRef.current = false;
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) {
        return;
      }
      requestAnimationFrame(() => {
        if (!source.getFeatures().length) {
          map.updateSize();
          return;
        }
        fitCurrentGeometry();
      });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      unByKey([addFeatureKey, modifyEndKey, drawStartKey]);
      resizeObserver.disconnect();
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [inputName, setInputValue]);

  useEffect(() => {
    const source = sourceRef.current;
    const wktValue = typeof inputValue === "string" ? inputValue.trim() : "";

    syncingRef.current = true;
    source.clear();
    setErrorText(undefined);

    if (!wktValue) {
      resetView();
      syncingRef.current = false;
      return;
    }

    try {
      const geometry = formatRef.current.readGeometry(wktValue, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
      source.addFeature(new Feature({ geometry }));
      requestAnimationFrame(() => {
        fitCurrentGeometry();
      });
    } catch (_error) {
      setErrorText("Could not parse WKT geometry.");
    } finally {
      syncingRef.current = false;
    }
  }, [inputValue]);

  const hasGeometry = typeof inputValue === "string" && inputValue.trim().length > 0;
  const wktValue = typeof inputValue === "string" ? inputValue.trim() : "";

  return (
    <Stack gap={"xs"}>
      <div ref={containerRef} className="map-input-editor-map" />
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          Draw one polygon. Existing WKT is loaded and can be modified.
        </Text>
        <Button
          variant="default"
          size="xs"
          disabled={!hasGeometry}
          onClick={() => setInputValue(inputName, "")}
        >
          Clear
        </Button>
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
