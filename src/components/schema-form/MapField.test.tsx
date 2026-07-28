import { MantineProvider } from "@mantine/core";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { MapField } from "./MapField";

describe("MapField", () => {
  it("shows polygon and rectangle controls for WKT map fields", () => {
    const field = getFieldFromSchema("geometry", {
      type: "string",
      title: "Geometry",
      "x-ui-widget": "map",
    } as JsonSchema);

    const markup = renderMapField(
      <MapField field={field} valueType="wkt" value="" onChange={vi.fn()} />,
    );

    expect(markup).toContain('aria-label="Draw rectangle"');
    expect(markup).toContain('aria-label="Draw polygon"');
    expect(markup).not.toContain('aria-label="Delete geometry"');
  });

  it("shows the delete control for WKT values that already contain geometry", () => {
    const field = getFieldFromSchema("geometry", {
      type: "string",
      title: "Geometry",
      "x-ui-widget": "map",
    } as JsonSchema);

    const markup = renderMapField(
      <MapField
        field={field}
        valueType="wkt"
        value="POLYGON((0 0,1 0,1 1,0 1,0 0))"
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-label="Delete geometry"');
  });

  it("shows only the delete control for bbox values with area", () => {
    const field = getFieldFromSchema("bbox", {
      type: "array",
      title: "BBox",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      "x-ui-widget": "map",
    } as JsonSchema);

    const markup = renderMapField(
      <MapField
        field={field}
        valueType="bbox"
        value={[7, 48, 8, 49]}
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-label="Delete geometry"');
    expect(markup).not.toContain('aria-label="Draw rectangle"');
    expect(markup).not.toContain('aria-label="Draw polygon"');
  });

  it("hides all controls for empty bbox values", () => {
    const field = getFieldFromSchema("bbox", {
      type: "array",
      title: "BBox",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      "x-ui-widget": "map",
    } as JsonSchema);

    const markup = renderMapField(
      <MapField
        field={field}
        valueType="bbox"
        value={[0, 0, 0, 0]}
        onChange={vi.fn()}
      />,
    );

    expect(markup).not.toContain('aria-label="Delete geometry"');
    expect(markup).not.toContain('aria-label="Draw rectangle"');
    expect(markup).not.toContain('aria-label="Draw polygon"');
  });
});

function renderMapField(element: ReactElement) {
  return renderToStaticMarkup(<MantineProvider>{element}</MantineProvider>);
}
