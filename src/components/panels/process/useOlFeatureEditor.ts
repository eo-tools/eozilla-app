import { useEffect, useRef } from "react";
import "ol/ol.css";
import Feature from "ol/Feature.js";
import type Geometry from "ol/geom/Geometry.js";
import Draw from "ol/interaction/Draw.js";
import Modify from "ol/interaction/Modify.js";
import Snap from "ol/interaction/Snap.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import Map from "ol/Map.js";
import { unByKey } from "ol/Observable.js";
import View from "ol/View.js";
import OSM from "ol/source/OSM.js";
import VectorSource from "ol/source/Vector.js";
import { fromLonLat } from "ol/proj.js";

const DEFAULT_CENTER = fromLonLat([11, 48]);
const DEFAULT_ZOOM = 4;
const FIT_OPTIONS = {
  padding: [24, 24, 24, 24] as [number, number, number, number],
  maxZoom: 12,
};

export interface UseOlFeatureEditorArgs {
  createDraw: (source: VectorSource) => Draw;
  writeValue: (geometry: Geometry | undefined) => void;
}

export interface UseOlFeatureEditorResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  setGeometry: (geometry?: Geometry) => void;
}

export function useOlFeatureEditor({
  createDraw,
  writeValue,
}: UseOlFeatureEditorArgs): UseOlFeatureEditorResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<Draw | null>(null);
  const sourceRef = useRef(new VectorSource());
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const source = sourceRef.current;
    const map = new Map({
      target: containerRef.current,
      controls: [],
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source }),
      ],
      view: new View({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      }),
    });
    const modify = new Modify({ source });
    const snap = new Snap({ source });

    map.addInteraction(modify);
    map.addInteraction(snap);
    mapRef.current = map;

    const fitGeometry = () => {
      const geometry = source.getFeatures()[0]?.getGeometry();
      if (!geometry) {
        map.updateSize();
        return;
      }
      map.updateSize();
      map.getView().fit(geometry.getExtent(), FIT_OPTIONS);
    };

    const addFeatureKey = source.on("addfeature", (event) => {
      if (syncingRef.current) {
        return;
      }
      writeValue(event.feature?.getGeometry());
    });
    const modifyEndKey = modify.on("modifyend", () => {
      if (syncingRef.current) {
        return;
      }
      writeValue(source.getFeatures()[0]?.getGeometry());
    });

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      if (entry.contentRect.width <= 0 || entry.contentRect.height <= 0) {
        return;
      }
      requestAnimationFrame(fitGeometry);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      unByKey([addFeatureKey, modifyEndKey]);
      resizeObserver.disconnect();
      map.setTarget(undefined);
      drawRef.current = null;
      mapRef.current = null;
    };
  }, [writeValue]);

  useEffect(() => {
    const map = mapRef.current;
    const source = sourceRef.current;
    if (!map) {
      return;
    }

    const currentDraw = drawRef.current;
    if (currentDraw) {
      map.removeInteraction(currentDraw);
    }

    const nextDraw = createDraw(source);
    drawRef.current = nextDraw;
    map.addInteraction(nextDraw);

    const drawStartKey = nextDraw.on("drawstart", () => {
      syncingRef.current = true;
      source.clear();
      syncingRef.current = false;
    });

    return () => {
      unByKey(drawStartKey);
      map.removeInteraction(nextDraw);
      if (drawRef.current === nextDraw) {
        drawRef.current = null;
      }
    };
  }, [createDraw]);

  const setGeometry = (geometry?: Geometry) => {
    const map = mapRef.current;
    const source = sourceRef.current;
    if (!map) {
      return;
    }

    syncingRef.current = true;
    source.clear();

    if (!geometry) {
      map.getView().setCenter(DEFAULT_CENTER);
      map.getView().setZoom(DEFAULT_ZOOM);
      syncingRef.current = false;
      return;
    }

    source.addFeature(new Feature({ geometry }));
    requestAnimationFrame(() => {
      map.updateSize();
      map.getView().fit(geometry.getExtent(), FIT_OPTIONS);
    });
    syncingRef.current = false;
  };

  return { containerRef, setGeometry };
}
